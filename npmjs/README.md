# @prodsaas/taphtml

An embeddable live chat widget. Use via a single HTML script tag or as a native React/Next.js component.

## Usage

### 1. React / Preact / Next.js
For modern component-based web setups, pull the package into your project dependencies.

```bash
npm install @prodsaas/taphtml
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

> 💡 **For Next.js project:** Because this widget relies on browser runtime APIs to register Custom Elements, ensure your rendering page includes the `"use client";` directive at the top, or load the component dynamically with `ssr: false`.

### 2. HTML
Perfect for static websites, landing pages, or raw HTML implementations. Simply drop the script tag into your document with your unique widget token.

```html
<head>
    <script async type="module" src="https://unpkg.com/@prodsaas/taphtml" data-id="YOUR_WIDGET_ID"></script>
</head>
```

## API Reference

| Configuration Option | Implementation Target |
| :--- | :--- |
| **`data-id`** | HTML `<script>` tag attribute |
| **`widgetID`** | React/Next.js Component Prop |