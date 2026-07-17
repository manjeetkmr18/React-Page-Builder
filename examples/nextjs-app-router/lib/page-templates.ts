import { createNode, type PageDocument } from "@manjeetkmr18/react-page-builder";

export type PageTemplate = "starter" | "landing";

export function createPageFromTemplate(title: string, template: PageTemplate): PageDocument {
  const heading = createNode("core/heading", {
    text: title,
    level: "h1",
    align: template === "landing" ? "center" : "left",
    color: template === "landing" ? "#ffffff" : "#172033",
    marginBottom: 16,
    marginTop: 0,
    marginLeft: 0,
    marginRight: 0,
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
  });

  if (template === "starter") {
    return {
      version: 1,
      root: [
        createNode(
          "core/section",
          {
            background: "#ffffff",
            paddingY: 72,
            paddingX: 24,
            maxWidth: 960,
            fullWidth: false,
            marginTop: 0,
            marginBottom: 0,
            marginLeft: 0,
            marginRight: 0,
            paddingTop: 0,
            paddingBottom: 0,
            paddingLeft: 0,
            paddingRight: 0,
          },
          [
            heading,
            createNode("core/text", {
              text: "Start writing here, or drag a block from the library to build your page.",
              align: "left",
              color: "#5d6678",
              fontSize: 18,
              lineHeight: 1.7,
              marginBottom: 16,
              marginTop: 0,
              marginLeft: 0,
              marginRight: 0,
              paddingTop: 0,
              paddingBottom: 0,
              paddingLeft: 0,
              paddingRight: 0,
            }),
          ]
        ),
      ],
    };
  }

  return {
    version: 1,
    root: [
      createNode(
        "core/section",
        {
          background: "#172033",
          paddingY: 112,
          paddingX: 24,
          maxWidth: 880,
          fullWidth: false,
          marginTop: 0,
          marginBottom: 0,
          marginLeft: 0,
          marginRight: 0,
          paddingTop: 0,
          paddingBottom: 0,
          paddingLeft: 0,
          paddingRight: 0,
        },
        [
          heading,
          createNode("core/text", {
            text: "A focused message that explains what makes your product or service worth choosing.",
            align: "center",
            color: "#c8d0df",
            fontSize: 19,
            lineHeight: 1.7,
            marginBottom: 28,
            marginTop: 0,
            marginLeft: 0,
            marginRight: 0,
            paddingTop: 0,
            paddingBottom: 0,
            paddingLeft: 0,
            paddingRight: 0,
          }),
          createNode("core/button", {
            label: "Get started",
            href: "#",
            align: "center",
            background: "#6d5dfc",
            color: "#ffffff",
            radius: 10,
            paddingY: 14,
            paddingX: 28,
            marginTop: 0,
            marginBottom: 0,
            marginLeft: 0,
            marginRight: 0,
            paddingTop: 0,
            paddingBottom: 0,
            paddingLeft: 0,
            paddingRight: 0,
          }),
        ]
      ),
      createNode(
        "core/section",
        {
          background: "#ffffff",
          paddingY: 80,
          paddingX: 24,
          maxWidth: 1080,
          fullWidth: false,
          marginTop: 0,
          marginBottom: 0,
          marginLeft: 0,
          marginRight: 0,
          paddingTop: 0,
          paddingBottom: 0,
          paddingLeft: 0,
          paddingRight: 0,
        },
        [
          createNode("core/heading", {
            text: "Build this section your way",
            level: "h2",
            align: "center",
            color: "#172033",
            marginBottom: 16,
            marginTop: 0,
            marginLeft: 0,
            marginRight: 0,
            paddingTop: 0,
            paddingBottom: 0,
            paddingLeft: 0,
            paddingRight: 0,
          }),
          createNode("core/text", {
            text: "Replace this copy, add columns, images, testimonials, and anything else your page needs.",
            align: "center",
            color: "#5d6678",
            fontSize: 17,
            lineHeight: 1.7,
            marginBottom: 16,
            marginTop: 0,
            marginLeft: 0,
            marginRight: 0,
            paddingTop: 0,
            paddingBottom: 0,
            paddingLeft: 0,
            paddingRight: 0,
          }),
        ]
      ),
    ],
  };
}

