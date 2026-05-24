# Quickstart: shadcn-ui Design System

## Setup

1. **Initialize shadcn/ui in the dashboard directory**:
   ```bash
   cd dashboard
   npx shadcn@latest init
   ```
   This creates `components.json` and `dashboard/components/ui/` directory.

2. **Add required components**:
   ```bash
   npx shadcn@latest add button table dialog input select badge card label avatar
   ```
   Components are installed as TypeScript/React source files in `dashboard/components/ui/`.

3. **Set up Tailwind CSS** (if not already configured):
   shadcn/ui requires Tailwind CSS. Ensure `tailwind.config.ts` exists and includes the shadcn/ui theme configuration.

4. **Configure dark mode**:
   Add `darkMode: 'class'` to `tailwind.config.ts` to enable class-based dark mode.

## Migration Steps

### Step 1: Set Up React (if not already using React)

The dashboard currently uses vanilla HTML/JS. shadcn/ui components are React components. Install React:

```bash
cd dashboard
npm install react react-dom
npm install -D @types/react @types/react-dom
```

Add a bundler (Vite is recommended for Workers Assets compatibility):

```bash
npm create vite@latest . -- --template react-ts
```

### Step 2: Migrate Dashboard HTML to React

1. Create React entry point (`main.tsx`) that mounts the dashboard app
2. Replace `index.html` table structure with React components
3. Replace vanilla JS event handlers with React event handlers
4. Keep `api.js` as-is (it already uses fetch and returns promises)

### Step 3: Add shadcn/ui Components

Replace each UI element with its shadcn/ui equivalent:

| Old UI | New shadcn/ui Component |
|--------|------------------------|
| `<table>` | `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` |
| `<button>` | `Button` |
| `<input>` | `Input` + `Label` |
| `<dialog>` (vanilla) | `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle` |
| `<select>` | `Select`, `SelectTrigger`, `SelectContent`, `SelectItem` |
| Status span | `Badge` |
| Detail sections | `Card`, `CardHeader`, `CardTitle`, `CardContent` |
| Customer avatar placeholder | `Avatar`, `AvatarImage`, `AvatarFallback` |

### Step 4: Apply Theme

Import shadcn/ui's base CSS in `index.css`:

```css
@import "shadcn/ui/styles.css";
/* Or inline the CSS variables from shadcn/ui template */
```

Configure CSS variables for the project's color scheme in `app.css`.

## Configuration

| Variable | Description |
|----------|-------------|
| `components.json` | shadcn/ui configuration (path to components, Tailwind config) |
| `tailwind.config.ts` | Tailwind configuration including shadcn/ui dark mode |
| `dashboard/components/ui/` | Directory containing all shadcn/ui components |

## API Usage

The existing API contracts remain unchanged. shadcn/ui components are purely presentational — they call the same `api.js` functions that the vanilla HTML dashboard uses.

```javascript
// API calls unchanged
const response = await api.getOrders({ status: 'new', limit: 50, offset: 0 });
```

## Component List

| Component | Command |
|-----------|---------|
| Button | `npx shadcn@latest add button` |
| Table | `npx shadcn@latest add table` |
| Dialog | `npx shadcn@latest add dialog` |
| Input | `npx shadcn@latest add input` |
| Select | `npx shadcn@latest add select` |
| Badge | `npx shadcn@latest add badge` |
| Card | `npx shadcn@latest add card` |
| Label | `npx shadcn@latest add label` |
| Avatar | `npx shadcn@latest add avatar` |