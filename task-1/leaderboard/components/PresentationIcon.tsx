import * as React from "react";
/**
 * У @fluentui/react-icons (Fluent System Icons) немає символу `Presentation20Regular`.
 * Найближчий аналог презентації / слайду — SlideText20Regular; аліас зберігає ім’я з доків.
 * Інші розміри: SlideText16Regular, SlideText24Regular, SlideText28Regular (+ *Filled).
 */
import { SlideText20Regular as Presentation20Regular } from "@fluentui/react-icons";

export function PresentationIcon(): React.ReactElement {
  return <Presentation20Regular />;
}
