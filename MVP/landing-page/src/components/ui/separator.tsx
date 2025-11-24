import * as React from "react";

const Separator = React.forwardRef<
  HTMLHRElement,
  React.HTMLAttributes<HTMLHRElement>
>(({ className, ...props }, ref) => (
  <hr
    ref={ref}
    className={`border-border border-t border-gray-200 dark:border-gray-700 ${className}`}
    {...props}
  />
));
Separator.displayName = "Separator";

export { Separator };
