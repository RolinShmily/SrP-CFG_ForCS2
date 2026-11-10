import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  layout("./layouts/site-layout.tsx", [index("./routes/home.tsx")]),

  route("console", "./layouts/console-layout.tsx", [
    index("./routes/console/index.tsx"),
    route("convars", "./routes/console/convars.tsx"),
    route("convars/:name", "./routes/console/convar-detail.tsx"),
    route("commands", "./routes/console/commands.tsx"),
    route("commands/:name", "./routes/console/command-detail.tsx"),
    route("categories", "./routes/console/categories.tsx"),
    route("categories/:slug", "./routes/console/category-detail.tsx"),
    route("flags", "./routes/console/flags.tsx"),
    route("flags/:flag", "./routes/console/flag-detail.tsx"),
    route("changes", "./routes/console/changes.tsx"),
  ]),

  route("*", "./routes/not-found.tsx"),
] satisfies RouteConfig;
