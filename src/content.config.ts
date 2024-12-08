import { SDK as SpeakeasySDK } from "@speakeasyapi/code-samples";
import { z } from "astro/zod";
import { defineCollection } from "astro:content";
import { SPEAKEASY_API_KEY } from "astro:env/server";

const CodeSampleSchema = z.object({
  lang: z.string(),
  label: z.string(),
  source: z.string(),
});

type CodeSample = z.infer<typeof CodeSampleSchema>;

const OpenAPISpecSchema = z.object({
  paths: z.record(
    z.string(),
    z.record(
      z.enum(["get", "post", "put", "delete"]),
      z.object({
        "x-codeSamples": CodeSampleSchema.array(),
      })
    )
  ),
});

const codeSamples = defineCollection({
  loader: async () => {
    const speakeasy = new SpeakeasySDK({
      security: {
        apiKey: SPEAKEASY_API_KEY,
      },
    });

    const oas = await fetch("https://petstore3.swagger.io/api/v3/openapi.json");

    const previewResult = await speakeasy.codesamples.preview({
      languages: ["typescript"],
      schemaFile: {
        fileName: "openapi.yaml",
        content: await oas.arrayBuffer(),
      },
      packageName: "petstore",
      sdkClassName: "PetstoreSDK",
    });

    const reader = previewResult.getReader();
    const decoder = new TextDecoder();
    let result = "";
    let done = false;

    while (!done) {
      const { value, done: streamDone } = await reader.read();
      done = streamDone;
      if (value) {
        result += decoder.decode(value, { stream: !done });
      }
    }

    const parsedSpec = OpenAPISpecSchema.parse(JSON.parse(result));

    const codeSampleCollection: Array<{ id: string } & CodeSample> = [];

    for (const pathSpec of Object.values(parsedSpec.paths)) {
      for (const pathMethodSpec of Object.values(pathSpec)) {
        for (const codeSample of pathMethodSpec["x-codeSamples"]) {
          codeSampleCollection.push({
            id: codeSample.label,
            ...codeSample,
          });
        }
      }
    }

    return codeSampleCollection;
  },

  schema: z.object({
    id: z.string(),
    ...CodeSampleSchema.shape,
  }),
});

export const collections = { codeSamples };
