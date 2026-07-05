# @prodsaas/taphtml

Embeddable live chat widget. Use via a single HTML script tag or as a React/Next.js component.

## Usage

### 1. React

```bash
npm i @prodsaas/taphtml
```

```jsx
import ChatWidget from "@prodsaas/taphtml";

function App() {
  return (
    <ChatWidget widgetID="YOUR_WIDGET_ID"/>
  );
}

export default App;
```

### 2. Next.js

```bash
npm i @prodsaas/taphtml
```

```jsx
"use client";

import ChatWidget from "@prodsaas/taphtml";

export default function Home() {
  return (
    <ChatWidget widgetID="YOUR_WIDGET_ID"/>
  );
}
```

### 3. HTML

```html
<head>
    <script async type="module" src="https://unpkg.com/@prodsaas/taphtml" data-id="YOUR_WIDGET_ID"></script>
</head>
```