// Phones and tablets: the main pointer is a finger, so there is no mouse cursor to draw smoke behind
export const IS_TOUCH = window.matchMedia("(pointer: coarse)").matches;
