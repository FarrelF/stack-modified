/**
 * Issue #1350: horizontal scrolling for the category and subsection strips.
 *
 * CSS cannot remap vertical wheel input to horizontal scrolling, so this is a
 * progressive enhancement. The strips keep their native scrolling (touch,
 * trackpad horizontal gestures, keyboard and scrollbar) and only vertical wheel
 * input over a strip that can still scroll is redirected. Once a strip reaches
 * its start or end edge, the event is released so the page scrolls normally.
 */

/// Approximate height of one line of body text, used to convert line-based
/// wheel deltas (classic mouse wheels) into pixels.
const LINE_HEIGHT = 16;

const getScrollMetrics = (container: HTMLElement) => {
    const maxScroll = Math.max(0, container.scrollWidth - container.clientWidth);
    const isRTL = getComputedStyle(container).direction === 'rtl';

    /// Normalize the scroll position to a positive offset from the logical start
    /// so the clamping math is identical in both writing directions.
    const position = isRTL ? Math.abs(container.scrollLeft) : container.scrollLeft;

    return { maxScroll, isRTL, position };
};

const getWheelDelta = (event: WheelEvent, container: HTMLElement) => {
    switch (event.deltaMode) {
        case WheelEvent.DOM_DELTA_LINE:
            return event.deltaY * LINE_HEIGHT;
        case WheelEvent.DOM_DELTA_PAGE:
            return event.deltaY * container.clientWidth;
        default:
            return event.deltaY;
    }
};

const handleWheel = (event: WheelEvent) => {
    if (event.defaultPrevented || event.deltaY === 0) {
        return;
    }

    /// Modifier combos belong to the browser (zoom, page zoom, back/forward) or
    /// to the native horizontal mapping of Shift + wheel.
    if (event.ctrlKey || event.shiftKey || event.altKey || event.metaKey) {
        return;
    }

    /// Horizontal intent is already handled by the browser.
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
        return;
    }

    const target = event.target as Element | null;
    const container = target?.closest('.subsection-list') as HTMLElement | null;
    if (!container) {
        return;
    }

    const { maxScroll, isRTL, position } = getScrollMetrics(container);

    /// Nothing to scroll: the page keeps the wheel input.
    if (maxScroll <= 1) {
        return;
    }

    /// `position` is always measured from the logical start, so a positive delta
    /// always moves forward regardless of the writing direction.
    const delta = getWheelDelta(event, container);
    const next = Math.min(maxScroll, Math.max(0, position + delta));

    /// Already at the edge in the requested direction: release the event.
    if (next === position) {
        return;
    }

    event.preventDefault();
    container.scrollLeft = isRTL ? -next : next;
};

const init = () => {
    const containers = document.querySelectorAll<HTMLElement>('.subsection-list');

    for (const container of Array.from(containers)) {
        /// `passive: false` is required to be able to cancel the wheel event.
        container.addEventListener('wheel', handleWheel, { passive: false });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
    init();
}
