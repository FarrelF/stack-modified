/*!
 *   WebMCP support for Hugo Theme Stack
 *
 *   Exposes read-only, site-defined tools through the experimental
 *   WebMCP API (document.modelContext). The script is only loaded when
 *   `params.webmcp.enabled` is true and does nothing in browsers that do
 *   not implement WebMCP.
 *
 *   Tools:
 *   - search_site(query, limit)
 *   - get_current_article()
 */

interface WebMCPToolAnnotations {
    readOnlyHint?: boolean;
    untrustedContentHint?: boolean;
    consequentialHint?: boolean;
    debugging?: boolean;
}

interface WebMCPTool {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
    annotations?: WebMCPToolAnnotations;
    execute: (
        input: Record<string, unknown>,
        options?: { signal?: AbortSignal }
    ) => Promise<unknown> | unknown;
}

interface ModelContextLike {
    registerTool?: (
        tool: WebMCPTool,
        options?: { signal?: AbortSignal; exposedTo?: string[] }
    ) => Promise<void> | void;
    provideContext?: (context: { tools: WebMCPTool[] }) => Promise<void> | void;
}

interface SiteConfig {
    title: string;
    url: string;
    language: string;
}

interface HeadingData {
    id: string;
    title: string;
    level: number;
}

interface ArticleData {
    title: string;
    url: string;
    description: string;
    published: string;
    updated: string;
    authors: string[];
    section: string;
    tags: string[];
    categories: string[];
    headings: HeadingData[];
}

interface WebMCPConfig {
    site: SiteConfig;
    searchIndex?: string;
    article?: ArticleData;
}

interface SearchIndexItem {
    title?: string;
    date?: string;
    permalink?: string;
    content?: string;
    image?: string;
    section?: string;
    tags?: string[];
    categories?: string[];
    description?: string;
}

interface PreparedSearchItem {
    item: SearchIndexItem;
    title: string;
    content: string;
    metadata: string;
}

interface SearchResult {
    title: string;
    url: string;
    date: string;
    section: string;
    tags: string[];
    categories: string[];
    excerpt: string;
}

interface ScoredSearchResult extends SearchResult {
    score: number;
    matchedTokens: number;
}

interface SearchResponse {
    query: string;
    count: number;
    results: SearchResult[];
}

interface SearchToolInput {
    query?: unknown;
    limit?: unknown;
}

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 20;
const MAX_QUERY_LENGTH = 200;
const MAX_TOKENS = 12;
const EXCERPT_LENGTH = 240;

let config: WebMCPConfig | null = null;
let configLoaded = false;
let searchIndexPromise: Promise<PreparedSearchItem[]> | null = null;
let registered = false;
const controllers: AbortController[] = [];
const registeredTools: string[] = [];

const htmlEntities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
    '&lsquo;': '\u2018',
    '&rsquo;': '\u2019',
    '&ldquo;': '\u201c',
    '&rdquo;': '\u201d',
    '&hellip;': '\u2026',
    '&mdash;': '\u2014',
    '&ndash;': '\u2013'
};

function decodeHtmlEntities(value: string): string {
    if (!value || value.indexOf('&') === -1) return value;

    return value.replace(/&(?:#x?[0-9a-f]+|[a-z][a-z0-9]+);/gi, (entity) => {
        const named = htmlEntities[entity.toLowerCase()];
        if (named !== undefined) return named;

        const numeric = /^&#(x?)([0-9a-f]+);$/i.exec(entity);
        if (numeric) {
            const code = parseInt(numeric[2], numeric[1] ? 16 : 10);
            if (Number.isFinite(code)) {
                try {
                    return String.fromCodePoint(code);
                } catch {
                    return entity;
                }
            }
        }

        return entity;
    });
}

function cleanText(value: string): string {
    return decodeHtmlEntities(value).replace(/\s+/g, ' ').trim();
}

function normalize(value: string): string {
    return value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function tokenize(query: string): string[] {
    const normalized = normalize(query).slice(0, MAX_QUERY_LENGTH);
    const tokens: string[] = [];
    const tokenPattern = /"([^"]+)"|(\S+)/g;
    let match: RegExpExecArray | null;

    while ((match = tokenPattern.exec(normalized)) !== null) {
        const token = (match[1] || match[2] || '').trim();
        if (token) tokens.push(token);
    }

    return Array.from(new Set(tokens)).slice(0, MAX_TOKENS);
}

function countOccurrences(haystack: string, needle: string): number {
    if (!needle) return 0;

    let count = 0;
    let index = haystack.indexOf(needle);

    while (index !== -1) {
        count++;
        index = haystack.indexOf(needle, index + needle.length);
    }

    return count;
}

function toStringArray(value: unknown): string[] {
    if (Array.isArray(value)) {
        return value.map((item) => String(item)).filter(Boolean);
    }

    if (typeof value === 'string' && value.trim() !== '') {
        return [value.trim()];
    }

    return [];
}

function normalizeLimit(value: unknown): number {
    const parsed =
        typeof value === 'number'
            ? value
            : typeof value === 'string'
                ? Number(value)
                : NaN;

    if (!Number.isFinite(parsed)) return DEFAULT_LIMIT;

    return Math.min(MAX_LIMIT, Math.max(1, Math.floor(parsed)));
}

function dateValue(value: string): number {
    const time = Date.parse(value);
    return Number.isNaN(time) ? 0 : time;
}

function absoluteUrl(value: string): string {
    if (!value) return '';

    try {
        return new URL(value, document.baseURI).href;
    } catch {
        return value;
    }
}

function truncate(value: string, maxLength: number): string {
    if (value.length <= maxLength) return value;

    const slice = value.slice(0, maxLength);
    const lastSpace = slice.lastIndexOf(' ');
    const shortened = lastSpace > maxLength * 0.6 ? slice.slice(0, lastSpace) : slice;

    return shortened.trimEnd() + '\u2026';
}

function buildExcerpt(content: string, tokens: string[], description: string): string {
    const text = cleanText(content || description || '');
    if (!text) return '';

    const lower = text.toLowerCase();
    let firstMatch = -1;

    for (const token of tokens) {
        const index = lower.indexOf(token);
        if (index !== -1 && (firstMatch === -1 || index < firstMatch)) {
            firstMatch = index;
        }
    }

    if (firstMatch === -1) {
        return truncate(text, EXCERPT_LENGTH);
    }

    const start = Math.max(0, firstMatch - 80);
    const end = Math.min(text.length, firstMatch + 160);
    let excerpt = text.slice(start, end).trim();

    if (start > 0) excerpt = '\u2026' + excerpt;
    if (end < text.length) excerpt += '\u2026';

    return excerpt;
}

function getConfig(): WebMCPConfig | null {
    if (configLoaded) return config;

    const element = document.getElementById('webmcp-config');
    if (!element || !element.textContent) return null;

    /// The script may run before the configuration element is parsed (for
    /// example when inline scripts are enabled), so only mark the config as
    /// loaded once the element actually exists.
    configLoaded = true;

    try {
        config = JSON.parse(element.textContent) as WebMCPConfig;
    } catch (error) {
        console.warn('[WebMCP] Failed to parse the page configuration:', error);
        config = null;
    }

    return config;
}

function getModelContext(): ModelContextLike | null {
    const context = (document as Document & { modelContext?: ModelContextLike }).modelContext;

    if (
        context &&
        (typeof context.registerTool === 'function' ||
            typeof context.provideContext === 'function')
    ) {
        return context;
    }

    return null;
}

function prepareSearchItem(item: SearchIndexItem): PreparedSearchItem {
    const tags = toStringArray(item.tags);
    const categories = toStringArray(item.categories);

    return {
        item,
        title: normalize(item.title || ''),
        content: normalize(item.content || ''),
        metadata: normalize(
            [item.section || '', tags.join(' '), categories.join(' '), item.description || '']
                .filter(Boolean)
                .join(' ')
        )
    };
}

async function loadSearchIndex(signal?: AbortSignal): Promise<PreparedSearchItem[]> {
    if (!searchIndexPromise) {
        const currentConfig = getConfig();

        if (!currentConfig || !currentConfig.searchIndex) {
            throw new Error(
                'Search is not available because this site does not expose a Stack search index.'
            );
        }

        searchIndexPromise = fetch(currentConfig.searchIndex, {
            credentials: 'same-origin',
            signal
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(
                        `The search index request failed with HTTP ${response.status}.`
                    );
                }

                return response.json() as Promise<unknown>;
            })
            .then((data) => {
                if (!Array.isArray(data)) {
                    throw new Error('The search index is not a JSON array.');
                }

                return (data as SearchIndexItem[]).map(prepareSearchItem);
            })
            .catch((error) => {
                searchIndexPromise = null;
                throw error;
            });
    }

    return searchIndexPromise;
}

function scoreSearchItem(
    prepared: PreparedSearchItem,
    tokens: string[]
): ScoredSearchResult | null {
    let matchedTokens = 0;
    let titleMatches = 0;
    let contentMatches = 0;
    let metadataMatches = 0;

    for (const token of tokens) {
        const inTitle = countOccurrences(prepared.title, token);
        const inContent = countOccurrences(prepared.content, token);
        const inMetadata = countOccurrences(prepared.metadata, token);

        if (inTitle + inContent + inMetadata > 0) matchedTokens++;

        titleMatches += inTitle;
        contentMatches += inContent;
        metadataMatches += inMetadata;
    }

    if (matchedTokens === 0) return null;

    const item = prepared.item;

    return {
        title: item.title || '',
        url: absoluteUrl(item.permalink || ''),
        date: item.date || '',
        section: item.section || '',
        tags: toStringArray(item.tags),
        categories: toStringArray(item.categories),
        excerpt: buildExcerpt(item.content || '', tokens, item.description || ''),
        score: matchedTokens * 1000 + titleMatches * 100 + metadataMatches * 20 + contentMatches,
        matchedTokens
    };
}

async function searchSite(
    input: SearchToolInput = {},
    options?: { signal?: AbortSignal }
): Promise<SearchResponse> {
    const query = typeof input.query === 'string' ? input.query.trim() : '';

    if (!query) {
        throw new Error('The "query" argument is required and must be a non-empty string.');
    }

    const tokens = tokenize(query);

    if (tokens.length === 0) {
        throw new Error('The "query" argument did not contain any searchable words.');
    }

    const limit = normalizeLimit(input.limit);
    const index = await loadSearchIndex(options?.signal);

    const scored = index
        .map((prepared) => scoreSearchItem(prepared, tokens))
        .filter((result): result is ScoredSearchResult => result !== null);

    /// Prefer results that contain every token, but fall back to partial
    /// matches so a too-specific query still returns something useful.
    const fullMatches = scored.filter((result) => result.matchedTokens === tokens.length);
    const pool = fullMatches.length > 0 ? fullMatches : scored;

    pool.sort((a, b) => b.score - a.score || dateValue(b.date) - dateValue(a.date));

    const results: SearchResult[] = pool.slice(0, limit).map((result) => ({
        title: result.title,
        url: result.url,
        date: result.date,
        section: result.section,
        tags: result.tags,
        categories: result.categories,
        excerpt: result.excerpt
    }));

    return {
        query,
        count: results.length,
        results
    };
}

function getCurrentArticle(): ArticleData {
    const currentConfig = getConfig();

    if (!currentConfig || !currentConfig.article) {
        throw new Error(
            'No article metadata is available on this page. Open an article before calling this tool.'
        );
    }

    return currentConfig.article;
}

async function registerTools(): Promise<boolean> {
    if (registered) return true;

    const context = getModelContext();
    const currentConfig = getConfig();

    if (!context || !currentConfig) return false;

    const tools: WebMCPTool[] = [];

    if (currentConfig.searchIndex) {
        tools.push({
            name: 'search_site',
            description:
                "Search this blog's existing Stack search index. Returns matching articles with title, URL, publication date, section, tags, categories, and a short excerpt. Use this when the user asks to find articles by keyword or topic.",
            inputSchema: {
                type: 'object',
                properties: {
                    query: {
                        type: 'string',
                        description:
                            'Search keywords. Multiple words are treated as a phrase or as individual terms.'
                    },
                    limit: {
                        type: 'integer',
                        minimum: 1,
                        maximum: MAX_LIMIT,
                        default: DEFAULT_LIMIT,
                        description: `Maximum number of results to return (1-${MAX_LIMIT}). Defaults to ${DEFAULT_LIMIT}.`
                    }
                },
                required: ['query'],
                additionalProperties: false
            },
            annotations: {
                readOnlyHint: true
            },
            execute: (input, options) => searchSite(input, options)
        });
    }

    if (currentConfig.article) {
        tools.push({
            name: 'get_current_article',
            description:
                'Return structured metadata for the article currently open in the browser, including title, canonical URL, description, publication and update dates, authors, section, tags, categories, and headings. Use this to understand or summarize the current article.',
            inputSchema: {
                type: 'object',
                properties: {},
                additionalProperties: false
            },
            annotations: {
                readOnlyHint: true
            },
            execute: () => getCurrentArticle()
        });
    }

    if (tools.length === 0) return false;

    if (typeof context.registerTool === 'function') {
        for (const tool of tools) {
            const controller = new AbortController();
            controllers.push(controller);

            try {
                await context.registerTool(tool, { signal: controller.signal });
                registeredTools.push(tool.name);
            } catch (error) {
                console.warn(`[WebMCP] Failed to register the "${tool.name}" tool:`, error);
            }
        }
    } else if (typeof context.provideContext === 'function') {
        /// Compatibility with the earlier Chrome origin-trial API.
        try {
            await context.provideContext({ tools });
            registeredTools.push(...tools.map((tool) => tool.name));
        } catch (error) {
            console.warn('[WebMCP] Failed to provide the page tools:', error);
        }
    }

    registered = registeredTools.length > 0;
    return registered;
}

const stackWebMCP = {
    version: '1.0.0',
    get config(): WebMCPConfig | null {
        return getConfig();
    },
    get registered(): boolean {
        return registered;
    },
    get tools(): string[] {
        return registeredTools.slice();
    },
    registerTools,
    searchSite,
    getCurrentArticle
};

(window as Window & { StackWebMCP?: typeof stackWebMCP }).StackWebMCP = stackWebMCP;

function init(): void {
    const attempt = () => {
        if (!getConfig()) return;
        void registerTools();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', attempt, { once: true });
    } else {
        attempt();
    }

    /// Some implementations expose modelContext slightly later than the
    /// initial document. A single retry on load is enough for progressive
    /// enhancement and keeps the page usable when WebMCP is absent.
    window.addEventListener('load', attempt, { once: true });
}

init();
