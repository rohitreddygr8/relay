import { useEffect } from "react";
import { useAppSelector } from "./redux-hooks";

export const useFloatClient = (clientElement: HTMLDivElement | null) => {
  const floatClient = useAppSelector((state) => state.room.floatClient);

  useEffect(() => {
    if (floatClient && clientElement) {
      clientElement.onpointerdown = (event) => {
        if (clientElement) {
          if (clientElement.hasPointerCapture(event.pointerId)) {
            clientElement.releasePointerCapture(event.pointerId);
          }
          const clientRect = clientElement.getBoundingClientRect();
          const shiftX = event.clientX - clientRect.left;
          const shiftY = event.clientY - clientRect.top;
          clientElement.style.transform = "scale(0.97)";

          window.onpointermove = (e) => {
            if (clientElement && clientElement.parentElement) {
              if (
                clientRect.width - shiftX + e.clientX <=
                  clientElement.parentElement.getBoundingClientRect().right - 24 &&
                e.clientX >= shiftX
              ) {
                clientElement.style.left = e.clientX - shiftX + "px";
              }
              if (
                clientRect.height - shiftY + e.clientY <
                  clientElement.parentElement.getBoundingClientRect().bottom - 24 &&
                e.clientY >= shiftY
              ) {
                clientElement.style.top = e.clientY - shiftY + "px";
              }
            }
          };
        }
      };
      window.onpointerup = () => {
        if (clientElement) {
          clientElement.style.transform = "scale(1)";
        }
        window.onpointermove = null;
      };
    }
    return () => {
      if (clientElement) {
        clientElement.onpointerdown = null;
        window.onpointermove = null;
      }
    };
  }, [floatClient]);

  return floatClient;
};
