# UI quality report

The shell rendered by `renderProduct` has a status role, an alert for failures, a 44px retry control, and redacted identifiers. Amounts use `en-US` grouping. Non-finite amounts render as an em dash. Empty history says there is no confirmed activity. A prohibited action is not labeled successful.

No browser viewport pass was run. These pages are not a deployed site, and there is no separate mobile layout beyond the existing viewport meta tag. Keyboard order is the document order of the table and the retry button. Contrast was not measured with a tool.

Slow-network behavior is the client timeout and unavailable states. A retry repeats a read.
