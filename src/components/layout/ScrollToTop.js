import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
    const { pathname } = useLocation();

    useLayoutEffect(() => {
        const reset = () => {
            window.scrollTo(0, 0);

            // Target known containers
            const knownContainers = [
                document.querySelector(".main-content"),
                document.querySelector(".right-area"),
                document.querySelector(".right-area")?.lastElementChild,
                document.querySelector(".dashboard-wrapper"),
                document.body,
                document.documentElement
            ];

            knownContainers.forEach(el => {
                if (el) el.scrollTop = 0;
            });

            // Broad sweep for any element that might be the primary scroll container
            document.querySelectorAll('*').forEach(el => {
                if (el.scrollHeight > el.clientHeight && (window.getComputedStyle(el).overflowY === 'auto' || window.getComputedStyle(el).overflowY === 'scroll')) {
                    el.scrollTop = 0;
                }
            });
        };

        // Immediate
        reset();

        // After render
        const timer1 = setTimeout(reset, 10);
        const timer2 = setTimeout(reset, 100);
        const timer3 = setTimeout(reset, 300); // Robust fallback

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };
    }, [pathname]);

    return null;
};

export default ScrollToTop;
