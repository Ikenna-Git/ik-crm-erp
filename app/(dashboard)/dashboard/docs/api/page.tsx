const swaggerSrcDoc = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      html, body, #swagger-ui { margin: 0; padding: 0; height: 100%; background: #0b1020; }
      .swagger-ui .topbar { display: none; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: "/api/openapi",
        dom_id: "#swagger-ui",
        deepLinking: true,
        persistAuthorization: true,
        displayRequestDuration: true,
        defaultModelsExpandDepth: 1
      });
    </script>
  </body>
</html>`

export default function ApiDocsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">API Documentation</h1>
        <p className="text-sm text-muted-foreground">
          Interactive docs powered by your local OpenAPI spec at <code>/api/openapi</code>.
        </p>
      </div>
      <div className="rounded-lg border border-border overflow-hidden h-[calc(100vh-14rem)] bg-background">
        <iframe title="Civis API Docs" srcDoc={swaggerSrcDoc} className="w-full h-full border-0" />
      </div>
    </div>
  )
}
