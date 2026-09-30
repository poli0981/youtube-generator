import { domMax } from "motion/react";

// Loaded lazily by MotionProvider — layout animations (the sliding nav
// indicator) need domMax rather than the smaller domAnimation.
export default domMax;
