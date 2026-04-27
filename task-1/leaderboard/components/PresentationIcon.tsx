import * as React from "react";

/**
 * Офіційний контур Presentation з SharePoint / Office (viewBox 2048), не входить у @fluentui/react-icons як окремий 20px-файл.
 * Те саме джерело: `assets/icons/fluent/presentation-2048.svg`
 */
export function Presentation20Regular(
  props: React.SVGProps<SVGSVGElement>,
): React.ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 2048 2048"
      fill="currentColor"
      aria-hidden="true"
      focusable={false}
      width="1em"
      height="1em"
      {...props}
    >
      <path
        fill="currentColor"
        d="M0 0h1920v128h-128v896q0 26-10 49t-27 41t-41 28t-50 10h-640v640h512v128H384v-128h512v-640H256q-26 0-49-10t-41-27t-28-41t-10-50V128H0zm1664 1024V128H256v896zm-256-512v128H512V512z"
      />
    </svg>
  );
}

export function PresentationIcon(): React.ReactElement {
  return <Presentation20Regular />;
}
