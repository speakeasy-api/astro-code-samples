import { z } from "astro/zod";
import { defineCollection } from "astro:content";
import { parse } from "yaml";

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

function parseJSONorYAML(input: string): any {
  try {
    return JSON.parse(input);
  } catch (jsonError) {
    try {
      return parse(input);
    } catch (yamlError) {
      throw new Error("Failed to parse input as JSON or YAML");
    }
  }
}

const codeSamples = defineCollection({
  loader: async () => {
    const publicOASResponse = await fetch(
      "https://spec.speakeasy.com/walker/walker/wizard-world-api-with-code-samples"
    );

    const publicOAS = await publicOASResponse.text();

    const unvalidatedSpec = parseJSONorYAML(publicOAS);

    const validatedSpec = OpenAPISpecSchema.parse(unvalidatedSpec);

    const codeSampleCollection: Array<{ id: string } & CodeSample> = [];

    for (const pathSpec of Object.values(validatedSpec.paths)) {
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
