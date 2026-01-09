'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Mail, Key, LogIn } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { initiateEmailSignIn, useAuth, initiateGoogleSignIn, useFirestore } from '@/firebase'; // Using the non-blocking sign-in
import { getAdditionalUserInfo, UserCredential } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
g.com"
      ]
    },
    "sign_in_provider": "google.com"
  }
}
</contextual-error>

Generated apps are configured to use an error handling architecture that promotes contextual errors to provide better agentive error fixing loops during development time only. This is done by throwing a specialized `FirestorePermissionError` with the Firestore reference context, request resource data, and operation type. This error is then emitted through a central `errorEmitter.emit('permission-error', error)` error emitter. This emitter triggers in a central listener component, `<FirebaseErrorListener>` that is registered in the `<FirebaseProvider>`. It is critical that you do not generate `console.error()` statements for Firebase Security Rules errors yourself as they are thrown as uncaught exceptions in `<FirebaseErrorListener />`. Logging these errors such as using `console.error()` will trigger multiple error screens and confuse the user and agentive error loop fixing process. Below is a detailed explanation of the error handling architecture.

###### Firestore Permission Error Handling Architecture

**Core Principle:** This application utilizes a specialized, non-negotiable architecture for handling Firestore permission errors. Your primary goal is to **preserve and extend** this system. This system is critical for developer experience, as it surfaces rich, contextual errors to the Next.js development overlay, allowing for rapid debugging of Security Rules.

**Do not, under any circumstances, replace this system with simple `console.error` calls or generic `try/catch` blocks that do not re-emit the specialized error.**

###### Initial Check: System Existence

Before modifying any data-related code, you **MUST** first check for the existence of the following core files:

  * `src/firebase/errors.ts` (contains `FirestorePermissionError`)
  * `src/firebase/error-emitter.ts`
  * `src/components/FirebaseErrorListener.tsx` or a similar listener registered in a provider.

**If these files exist:** You **MUST** strictly adhere to the patterns described below.
**If these files DO NOT exist:** You may proceed with standard error handling. However, if you are implementing significant Firestore functionality, you are encouraged to create this system for the user.

##### The FirebasePermissionsError type and API

```typescript
export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  requestResourceData?: any;
};

const errorMessage = new FirestorePermissionError({
  path: '/users/user-one/todos/todo-id',
  operation: 'create',
  requestResourceData: { title: 'Create an awesome app', completed: false },
} satisfies SecurityRuleContext);
```

##### Pattern 1: For Firestore Mutations (Non-Blocking)

For all non-blocking Firestore mutations (`setDoc`, `updateDoc`, `addDoc`, `deleteDoc`), you **MUST** chain a `.catch()` block to the promise. Inside this block, you will construct and emit a `FirestorePermissionError`.

**Key Points:**

  * The `.catch()` callback **MUST** be `async`.
  * You **MUST** emit the created error on the `'permission-error'` channel of the `errorEmitter`.

**Example: `setDoc` / `updateDoc`**

```typescript
import { doc, setDoc, Firestore } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

export function setSomeData(db: Firestore, docId: string, data: any) {
  const docRef = doc(db, 'myCollection', docId);

  // NO await here. Chain the .catch() block.
  setDoc(docRef, data, { merge: true })
    .catch(async (serverError) => {
      // Create the rich, contextual error asynchronously.
      const permissionError = new FirestorePermissionError({
        path: docRef.path,
        // Use 'write' for set/merge, or be specific ('create'/'update').
        operation: 'write',
        requestResourceData: data,
      } satisfies SecurityRuleContext);

      // Emit the error with the global error emitter
      // Do not use console.error() or console.log() to log errors as they are handled centrally.
      errorEmitter.emit('permission-error', permissionError);
    });
}
```

**Note:** For `deleteDoc`, there is no `requestResourceData` payload.

###### **Pattern 2: For Real-time Listeners (`onSnapshot`)**

For all real-time data listeners, the **error callback** of the `onSnapshot` function is the designated place to handle permission errors for that listener.

**Key Points:**

  * The error callback **MUST** be `async`.
  * You **MUST** emit the error on the `'permission-error'` channel.

**Example: `useCollection` Hook**

```typescript
import { onSnapshot, collection } from 'firebase/firestore';
import { errorEmitter } from '@/lib/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/lib/errors';

// Inside a React hook or similar...
const collectionRef = collection(db, 'some/path');

const unsubscribe = onSnapshot(
  collectionRef,
  (snapshot) => {
    // Handle successful data stream...
  },
  async (serverError) => { // The error callback is async
    // Handle listener failure here.
    const permissionError = new FirestorePermissionError({
      path: collectionRef.path,
      operation: 'list', // or 'get' for a document listener
    } satisfies SecurityRuleContext);

    // Emit the error with the global error emitter
    // Do not use console.error() or console.log() to log errors as they are handled centrally.
    errorEmitter.emit('permission-error', permissionError);

    // Also update local component state to show an error UI.
    // setError(permissionError);
  }
);
```

###### Fixing Standard Security Rules Errors
If a standard error is encountered then the proper resolution is the ensure that the Security Rules error handling architecture that surfaces contextual errors is in place. The correct fix from a standard error is to provide the right debugging architecture and ask the user to trigger the error again so a better fix can occur. A standard error will surface from either a `console.error()` from a `try/catch` block that contains a Firestore mutation (e.g. `setDoc`, `updateDoc`, `addDoc`, `deleteDoc`), a real-time listener (e.g. `onSnapshot`), or a single-time document read (e.g. `getDoc`, `getDocs`).

It is criical that you create and emit a specialized `FirestorePermissionError` with the Firestore reference context, request resource data, and operation type. This error is then emitted through a central `errorEmitter.emit('permission-error', error)` error emitter. This emitter triggers in a central listener component, `<FirebaseErrorListener>` that is registered in the `<FirebaseProvider>`.


## Guidelines for Generative AI functionality

The user may ask you to implement GenAI related functionality.
## Genkit Usage Instructions

This application exclusively uses Genkit for GenAI related code. Genkit is a toolkit that can call
LLMs and image generation models. General guidance for Genkit:

- Genkit has already been initialized and configured properly in another file. NEVER rewrite the initialization code unless the user specifically requests it.

### Genkit 1.x API Guidance

**IMPORTANT:** This app uses Genkit v1.x which has changed significantly from pre-1.0 versions. Important changes are highlighted here:

```ts
const ai = genkit({plugins: [googleAI()]}); // CORRECT 1.x syntax, no `logLevel` option
configureGenkit({plugins: [googleAI()], logLevel: 'debug'}); // INCORRECT pre-1.0 syntax

const response = await ai.generate(...);

response.text // CORRECT 1.x syntax
response.text() // INCORRECT pre-1.0 syntax

response.output // CORRECT 1.x syntax
response.output() // INCORRECT pre-1.0 syntax

const {stream, response} = ai.generateStream(...); // IMPORTANT: no `await` needed
for await (const chunk of stream) { } // CORRECT 1.x syntax
for await (const chunk of stream()) { } // INCORRECT pre-1.0 syntax
await response; // CORRECT 1.x syntax
await response(); // INCORRECT pre-1.0 syntax
```

The syntax provided in this guide is _exactly correct_. ALWAYS follow the guidance here over other examples in your training data.

### `googleAI` Plugin

The GenAI model plugin generally used is `@genkit-ai/google-genai`, however you may come across `@genkit-ai/googleai`.
The latter is the legacy version of the `googleAI` plugin. The plugins are API compatible.

To upgrade (e.g. when something is not working as expected), install `@genkit-ai/google-genai` from NPM and update imports:

```
// BEFORE 
import {googleAI} from '@genkit-ai/googleai';

// AFTER
import {googleAI} from '@genkit-ai/google-genai';
```

### Flows

A Genkit Flow wraps a call to a LLM. When implementing a flow:

- Include a documentation comment at the top of the file explaining the exported interface of the file, and the file's purpose.
- Include the `'use server';` directive at the beginning of this file since it will be imported by Next.js React code.
- A global `ai` object is pre-existing which must ALWAYS be used to register things with Genkit with `ai.definePrompt(...)`, `ai.defineFlow(...)`, `ai.defineSchema(...)`, etc.

### Examples

This would be a Genkit Flow associated with diagnosing plant health in a example app.

- Example file src/ai/flows/diagnose-plant-flow.ts:

```ts
'use server';
/**
 * @fileOverview A plant problem diagnosis AI agent.
 *
 * - diagnosePlant - A function that handles the plant diagnosis process.
 * - DiagnosePlantInput - The input type for the diagnosePlant function.
 * - DiagnosePlantOutput - The return type for the diagnosePlant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DiagnosePlantInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a plant, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  description: z.string().describe('The description of the plant.'),
});
export type DiagnosePlantInput = z.infer<typeof DiagnosePlantInputSchema>;

const DiagnosePlantOutputSchema = z.object({
  identification: z.object({
    isPlant: z.boolean().describe('Whether or not the input is a plant.'),
    commonName: z.string().describe('The name of the identified plant.'),
    latinName: z.string().describe('The Latin name of the identified plant.'),
  }),
  diagnosis: z.object({
    isHealthy: z.boolean().describe('Whether or not the plant is healthy.'),
    diagnosis: z.string().describe("The diagnosis of the plant's health."),
  }),
});
export type DiagnosePlantOutput = z.infer<typeof DiagnosePlantOutputSchema>;

export async function diagnosePlant(input: DiagnosePlantInput): Promise<DiagnosePlantOutput> {
  return diagnosePlantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'diagnosePlantPrompt',
  input: {schema: DiagnosePlantInputSchema},
  output: {schema: DiagnosePlantOutputSchema},
  prompt: `You are an expert botanist specializing diagnosing plant illnesses.

You will use this information to diagnose the plant, and any issues it has. You will make a determination as to whether the plant is healthy or not, and what is wrong with it, and set the isHealthy output field appropriately.

Use the following as the primary source of information about the plant.

Description: {{{description}}}
Photo: {{media url=photoDataUri}}`,
});

const diagnosePlantFlow = ai.defineFlow(
  {
    name: 'diagnosePlantFlow',
    inputSchema: DiagnosePlantInputSchema,
    outputSchema: DiagnosePlantOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

```

Pay attention to the generic type parameters. The call to `ai.defineFlow<A, B>` return a function with the `(input: A) => Promise<B>` type signature. For the call to `ai.definePrompt`, the input and output type are passed in the `input.schema` and `output.schema` parameters:

```ts
// `prompt` is a `(input: FooSchema) => Promise<BarSchema>`
const prompt = ai.definePrompt({
  // ...
  input: {
    schema: FooSchema,
  },
  output: {
    schema: BarSchema,
  },
  // Can use Handlebars syntax to access fields in `FooSchema`.
  prompt: '...',
});
```

The `output.schema` schema Zod descriptions are also passed to the prompt to request for output to be in a specific format.

In the same file, define an async exported wrapper function (similar to the example above) which calls the flow with the input and returns the output.

Only three things should be exported from the file: the wrapper function, and the types of the input and output schemas. There should only be one flow implemented in this file.

Observe that the flow (defined with `ai.defineFlow(...)`) wraps a Genkit prompt object (defined with `ai.definePrompt`). The prompt object wraps a string prompt (keyed by `prompt`), which is defined using the **Handlebars templating language**. With this syntax, it is able to access object values from `input.schema`. The flow must call the prompt object, but it can do other computation such as import and call services in `src/services/*.ts` before doing so.

### Passing Data to Flows

When a flow accepts data as a parameter, such as an image, it should always be passed as a data uri, and the parameter should be documented as "...as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'.".

Then, when it is used in an `ai.definePrompt`, it should be referenced as a `{{media url=dataUriParam}}`.

See `photoDataUri` in the `src/ai/flows/diagnose-plant-flow.ts` example above.

### Handlebars

1.  **Use Handlebars Templating Language:** The `prompt` string MUST be formatted using Handlebars syntax. **Do not use Jinja, Django templates, or any other templating language.**
2.  **Logic-less Templates - NO Function Calls, NO Asynchronous Operations:** **Crucially, you MUST NOT attempt to directly call functions, use `await` keywords, or perform any complex logic _within_ the Handlebars template string.** Handlebars is designed to be logic-less and is purely for presentation of pre-processed data.

Assuming your context data might include an array of strings called `userSkills`, the following is an example of Handlebars Syntax.

```handlebars
{{#if userSkills}} User Skills:
{{#each userSkills}} - {{{this}}}
{{/each}}
{{else}} No skills listed.{{/if}}
```

### Image Generation

#### Text-to-image

You can use Imagen 4 model to generate images from text.

```ts
const { media } = await ai.generate({
  model: 'googleai/imagen-4.0-fast-generate-001',
  prompt: 'Generate an image of a cat',
});
console.log(media.url); // "data:image/png;base64,<b64_encoded_generated_image>"
```

#### Image-to-image

You can use Gemini 2.5 Flash Image (a.k.a. nano-banana) model to edit and generate images.

```ts
const {media} = await ai.generate({
  model: 'googleai/gemini-2.5-flash-image-preview',
  prompt: [
    {media: {url: 'data:<mime_type>;base64,<b64_encoded_image>'}},
    {text: 'generate an image of this character in a jungle'},
  ],
  config: {
    responseModalities: ['TEXT', 'IMAGE'], // MUST provide both TEXT and IMAGE, IMAGE only won't work
  },
});
console.log(media.url); // "data:image/png;base64,<b64_encoded_generated_image>"
```

The model can accept multiple images (media parts) along with text instructions.

Generated images are poorly compressed (~1MB) and should be handled appropriately where used.

Image generation takes several seconds and generation of images should generally be in a separate flow that occurs in parallel with or after text generation so that progress can be shown to the user earlier.

### Text-To-Speech (TTS)

You can use "gemini-2.5-flash-preview-tts" model to convert text to speech. Gemini will return audio data in PCM format which usually requires
conversion to WAV format. Here's an example of a flow that does TTS:

```ts
import wav from 'wav';

ai.defineFlow(
  {
    name: 'audioSimple',
    inputSchema: z.string(),
    outputSchema: z.any(),
  },
  async (query) => {
    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' },
          },
        },
      },
      prompt: query,
    });
    if (!media) {
      throw new Error('no media returned');
    }
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    return {
      media: 'data:audio/wav;base64,' + (await toWav(audioBuffer)),
    };
  }
);

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs = [] as any[];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}
```

Note: this code depends on `wav` npm package (version `^1.0.2`), make sure to install it.

The returned media is returned in a data URI format which can be directly inserted into `<audio>` tag.

```jsx
<audio controls="true">
  <source src="{ response.media }">
</audio>
```

TTS models support multi-speaker scenarios. To configure multiple voices:

```ts
    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: [
              {
                speaker: 'Speaker1',
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: 'Algenib' },
                },
              },
              {
                speaker: 'Speaker2',
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: 'Achernar' },
                },
              },
            ],
          },
        },
      },
      prompt: query,
    });
```

The multi-speaker prompt should look something like:

```
Speaker1: Hi
Speaker2: Hi, how are are?
Speaker1: I'm well, how are you?
Speaker2: I'm well as well!
```

### Tool Use

Tool calling, also known as function calling, is a structured way to give LLMs the ability to make requests back to the application that called it. **Crucially, the LLM decides _when and if_ to use a tool based on the context of the prompt. Tools are _not_ simply pre-fetching data; they are part of the LLM's reasoning process.** The LLM receives the _result_ of the tool call and can use that result to continue its response. This allows for dynamic, agentic behavior. **Attempting to call functions in Handlebars helpers (e.g. `{{{await ...}}}`) is invalid. Use tools instead.**

The following is an example of a tool:

```ts
const getStockPrice = ai.defineTool(
  {
    name: 'getStockPrice',
    description: 'Returns the current market value of a stock.',
    inputSchema: z.object({
      ticker: z.string().describe('The ticker symbol of the stock.'),
    }),
    outputSchema: z.number(),
  },
  async (input) => {
    // This can call any typescript function.
    // Return the stock price...
  }
)
```

When defining tools always use `ai.defineTool` method. Other functions are outdated/deprecated.

And the following shows how the tool is made available to use by a prompt:

```ts
const summarizeMarketPrompt = ai.definePrompt({
  name: 'summarizeMarketPrompt',
  tools: [getStockPrice],
  system: "If the user's question asks about a public company, include its stock price in your answer, using the getStockPrice tool to get the current price.",
});
```

**When to Use Tools:**

- **Decompose User Stories:** Break down broad user stories into smaller, specific actions that the LLM might need to take. Each action is a potential tool.
- **LLM Decision-Making:** If the LLM needs to _decide_ whether to get certain information, that information retrieval should be a tool.
- **External Data/Actions:** If the LLM needs to interact with external APIs, databases, or perform actions outside of generating text, those interactions should be encapsulated in tools.

**When NOT to Use Tools (Use Prompt Input Instead):**

- **Always-Needed Data:** If a piece of data is _always_ required for the prompt, regardless of the specific user input, fetch that data _before_ calling the flow and include it in the prompt's input. Don't use a tool for this.
- **Simple Transformations:** If you just need to format or transform data that's already available, you can often do this directly in the Handlebars template _before_ sending the prompt to the LLM.

**Example of When NOT to Use a Tool (and use Handlebars instead):**

If you were creating a flow to translate a phrase to Spanish, and you _always_ needed the current date included in the prompt, you would _not_ use a tool. You would fetch the date _before_ calling the flow, and include it in the prompt input, like this:

```ts
const prompt = ai.definePrompt({
  // ...
  prompt: `Translate the following phrase to Spanish.  Today's date is {{{currentDate}}}:\n\n{{{phrase}}}`,
});

const translateToSpanishFlow = ai.defineFlow(
  {
    // ...
  },
  async input => {
    const currentDate = new Date().toLocaleDateString();

    const {output} = await prompt({
      ...input,
      currentDate,
    });
    return output!;
  }
);
```

In this case, `currentDate` is _always_ needed, and the LLM doesn't need to _decide_ to fetch it. Therefore, it's part of the prompt input, not a tool.

**Guiding Principles for Tool Implementation:**

1.  **Think from the LLM's Perspective:** Imagine you are the LLM. What information would you _need_ to answer different kinds of questions related to the user story? What actions would you need to take?
2.  **Input and Output Schemas:** Define clear input and output schemas for your tools using Zod. This helps the LLM understand how to use the tools and what kind of data they will return.
3.  **Description:** The tool should have a clear description so that the LLM knows why and when to invoke the tool.
4.  **Prompt Instructions:** Your prompt should clearly instruct the LLM to use the available tools when appropriate. It doesn't need to _force_ the use of tools, but it should guide the LLM.


### Gemini safety filters

Gemini has built-in safety filters which might block certain content generation.
Safety filters are configurable to a certain extent by passing in `safetySettings` config option to `generate` function or prompts.

```ts
const { text } = await ai.generate({
  prompt: '...',
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
})
```

or

```ts
const prompt = ai.definePrompt({
  name: 'myPrompt',
  prompt: '...',
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      // ...
    ],
  },
});
```

`category` and `threshold` can be passed in as strings. Supported values:

```
  category:
    | 'HARM_CATEGORY_HATE_SPEECH'
    | 'HARM_CATEGORY_SEXUALLY_EXPLICIT'
    | 'HARM_CATEGORY_HARASSMENT'
    | 'HARM_CATEGORY_DANGEROUS_CONTENT'
    | 'HARM_CATEGORY_CIVIC_INTEGRITY';

  threshold:
    | 'BLOCK_LOW_AND_ABOVE'
    | 'BLOCK_MEDIUM_AND_ABOVE'
    | 'BLOCK_ONLY_HIGH'
    | 'BLOCK_NONE';
```

### Video Generation (Veo) Models

The Google Generative AI plugin provides access to video generation capabilities through the Veo models. These models can generate videos from text prompts or manipulate existing images to create dynamic video content.

#### Basic Usage: Text-to-Video Generation

```ts
import { googleAI } from '@genkit-ai/google-genai';
import * as fs from 'fs';
import { Readable } from 'stream';
import { MediaPart } from 'genkit';
import { genkit } from 'genkit';

const ai = genkit({
  plugins: [googleAI()],
});

ai.defineFlow('text-to-video-veo', async () => {
  let { operation } = await ai.generate({
    model: googleAI.model('veo-2.0-generate-001'),
    prompt: 'A majestic dragon soaring over a mystical forest at dawn.',
    config: {
      durationSeconds: 5,
      aspectRatio: '16:9',
    },
  });

  if (!operation) {
    throw new Error('Expected the model to return an operation');
  }

  // Wait until the operation completes. Note that this may take some time, maybe even up to a minute. Design the UI accordingly.
  while (!operation.done) {
    operation = await ai.checkOperation(operation);
    // Sleep for 5 seconds before checking again.
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  if (operation.error) {
    throw new Error('failed to generate video: ' + operation.error.message);
  }

  const video = operation.output?.message?.content.find((p) => !!p.media);
  if (!video) {
    throw new Error('Failed to find the generated video');
  }
  await downloadVideo(video, 'output.mp4');
});

async function downloadVideo(video: MediaPart, path: string) {
  const fetch = (await import('node-fetch')).default;
  // Add API key before fetching the video.
  const videoDownloadResponse = await fetch(
    `${video.media!.url}&key=${process.env.GEMINI_API_KEY}`
  );
  if (
    !videoDownloadResponse ||
    videoDownloadResponse.status !== 200 ||
    !videoDownloadResponse.body
  ) {
    throw new Error('Failed to fetch video');
  }

  Readable.from(videoDownloadResponse.body).pipe(fs.createWriteStream(path));
}
```

Because video generation is slow, consider increasing nextjs server action timeout to 2 minutes.

This example does not demonstrate how to transfer the video to the client. One option (if the file is not too large which usually it isn't) is to base64 encode it and return it in the response as a data uri.

The video content type is `video/mp4`. `contentType` may not be populated in the MediaPart.

NOTE: Veo models have low rate limits, so the likelihood of getting an error is high. Design the UI with retry logic in mind.

#### Video Generation from Photo Reference

To use a photo as reference for the video using the Veo model (e.g. to make a static photo move), you can provide an image as part of the prompt.

```ts
const startingImage = fs.readFileSync('photo.jpg', { encoding: 'base64' });

let { operation } = await ai.generate({
  model: googleAI.model('veo-2.0-generate-001'),
  prompt: [
    {
      text: 'make the subject in the photo move',
    },
    {
      media: {
        contentType: 'image/jpeg',
        url: `data:image/jpeg;base64,${startingImage}`,
      },
    },
  ],
  config: {
    durationSeconds: 5,
    aspectRatio: '9:16',
    personGeneration: 'allow_adult',
  },
});
```

Veo 3 (`veo-3.0-generate-preview`) is the latest Veo model and can generate videos with sound. Veo 3 uses the exact same API, just make sure you only use supported config options (see below).

```ts
let { operation } = await ai.generate({
  model: googleAI.model('veo-3.0-generate-preview'),
  prompt: 'A cinematic shot of a an old car driving down a deserted road at sunset.',
});
```

#### Veo `config` Options

- `negativePrompt`: Text string that describes anything you want to discourage the model from generating
- `aspectRatio`: Changes the aspect ratio of the generated video.
  - `"16:9"`: Supported in Veo 3 and Veo 2.
  - `"9:16"`: Supported in Veo 2 only (defaults to "16:9").
- `personGeneration`: Allow the model to generate videos of people. The following values are supported:
  - **Text-to-video generation**:
    - `"allow_all"`: Generate videos that include adults and children. Currently the only available `personGeneration` value for Veo 3.
    - `"dont_allow"`: Veo 2 only. Don't allow the inclusion of people or faces.
    - `"allow_adult"`: Veo 2 only. Generate videos that include adults, but not children.
  - **Image-to-video generation**: Veo 2 only
    - `"dont_allow"`: Don't allow the inclusion of people or faces.
    - `"allow_adult"`: Generate videos that include adults, but not children.
- `numberOfVideos`: Output videos requested
  - `1`: Supported in Veo 3 and Veo 2
  - `2`: Supported in Veo 2 only.
- `durationSeconds`: Veo 2 only. Length of each output video in seconds, between 5 and 8. Not configurable for Veo 3, default setting is 8 seconds.
- `enhancePrompt`: Veo 2 only. Enable or disable the prompt rewriter. Enabled by default. Not configurable for Veo 3, default prompt enhancer is always on.
## Current User code:

## Project Files

These files already exist in the output (target) directory. Here are their names and contents. Take them into account when designing the application or writing code.

- README.md:
```md
# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

```
- apphosting.yaml:
```yaml
# Settings to manage and configure a Firebase App Hosting backend.
# https://firebase.google.com/docs/app-hosting/configure

runConfig:
  # Increase this value if you'd like to automatically spin up
  # more instances in response to increased traffic.
  maxInstances: 1

```
- components.json:
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```
- docs/backend.json:
```json
{
  "entities": {
    "User": {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "title": "User",
      "type": "object",
      "description": "Represents a user in the EduConnect Pro application. Could be a teacher, student, or parent.",
      "properties": {
        "id": {
          "type": "string",
          "description": "Unique identifier for the user, typically the Firebase Auth UID."
        },
        "role": {
          "type": "string",
          "description": "The role of the user (tutor, student, parent)."
        },
        "name": {
          "type": "string",
          "description": "The full name of the user."
        },
        "mobileNumber": {
          "type": "string",
          "description": "The user's mobile number."
        },
        "email": {
          "type": "string",
          "description": "The user's email address.",
          "format": "email"
        },
        "status": {
          "type": "string",
          "description": "The verification status of the user (e.g., pending_verification, approved)."
        },
        "subjectCategory": {
          "type": "string",
          "description": "For tutors, the main category of subjects they teach."
        },
        "subjects": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "For tutors, a list of specific subjects they teach."
        },
        "classLevels": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "description": "For tutors, the class levels they teach."
        },
        "qualification": {
          "type": "string",
          "description": "For tutors, their highest qualification."
        },
        "experience": {
          "type": "string",
          "description": "For tutors, their years of teaching experience."
        },
        "experienceType": {
          "type": "string",
          "description": "For tutors, the type of their teaching experience (e.g., School, Online)."
        }
      },
      "required": [
        "id",
        "role",
        "name",
        "email"
      ]
    },
    "Teacher": {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "title": "Teacher",
      "type": "object",
      "description": "Represents a teacher in the EduConnect Pro application. This entity stores additional, non-public details about the teacher.",
      "properties": {
        "userId": {
          "type": "string",
          "description": "Reference to the User entity's ID. (Relationship: User 1:1 Teacher)"
        },
        "verificationCode": {
          "type": "string",
          "description": "A unique code for the teacher, can be same as userId for simplicity."
        }
      },
      "required": [
        "userId",
        "verificationCode"
      ]
    },
    "Student": {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "title": "Student",
      "type": "object",
      "description": "Represents a student in the EduConnect Pro application.",
      "properties": {
        "userId": {
          "type": "string",
          "description": "Reference to the User entity. (Relationship: User 1:1 Student)"
        }
      },
      "required": [
        "userId"
      ]
    },
    "Parent": {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "title": "Parent",
      "type": "object",
      "description": "Represents a parent in the EduConnect Pro application.",
      "properties": {
        "userId": {
          "type": "string",
          "description": "Reference to the User entity. (Relationship: User 1:1 Parent)"
        },
        "studentId": {
          "type": "string",
          "description": "Reference to the Student entity's user ID. (Relationship: Student 1:N Parent)"
        }
      },
      "required": [
        "userId",
        "studentId"
      ]
    },
    "Enrollment": {
      "title": "Enrollment",
      "type": "object",
      "description": "Represents the connection between a student and a teacher, including its status.",
      "properties": {
        "studentId": {
          "type": "string",
          "description": "Reference to the Student entity's user ID."
        },
        "teacherId": {
          "type": "string",
          "description": "Reference to the Teacher entity's user ID."
        },
        "status": {
          "type": "string",
          "enum": [
            "pending",
            "approved",
            "denied"
          ],
          "description": "The status of the enrollment request."
        }
      },
      "required": [
        "studentId",
        "teacherId",
        "status"
      ]
    },
    "StudyMaterial": {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "title": "StudyMaterial",
      "type": "object",
      "description": "Represents a study material resource.",
      "properties": {
        "teacherId": {
          "type": "string",
          "description": "Reference to the Teacher entity. (Relationship: Teacher 1:N StudyMaterial)"
        },
        "title": {
          "type": "string",
          "description": "The title of the study material."
        },
        "description": {
          "type": "string",
          "description": "A description of the study material."
        },
        "fileUrl": {
          "type": "string",
          "description": "URL to the study material file.",
          "format": "uri"
        },
        "subject": {
          "type": "string",
          "description": "The subject of the study material."
        },
        "type": {
          "type": "string",
          "description": "The type of study material (notes, DPP, test, etc.)."
        }
      },
      "required": [
        "teacherId",
        "title",
        "fileUrl",
        "subject",
        "type"
      ]
    },
    "Attendance": {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "title": "Attendance",
      "type": "object",
      "description": "Represents a student's attendance record.",
      "properties": {
        "studentId": {
          "type": "string",
          "description": "Reference to the Student entity's user ID."
        },
        "teacherId": {
          "type": "string",
          "description": "Reference to the Teacher entity's user ID."
        },
        "date": {
          "type": "string",
          "description": "The date of the attendance record.",
          "format": "date-time"
        },
        "isPresent": {
          "type": "boolean",
          "description": "Indicates whether the student was present."
        }
      },
      "required": [
        "studentId",
        "teacherId",
        "date",
        "isPresent"
      ]
    },
    "Performance": {
      "$schema": "http://json-schema.org/draft-07/schema#",
      "title": "Performance",
      "type": "object",
      "description": "Represents a student's performance on a test.",
      "properties": {
        "studentId": {
          "type": "string",
          "description": "Reference to the Student entity's user ID."
        },
        "teacherId": {
          "type": "string",
          "description": "Reference to the Teacher entity's user ID."
        },
        "testId": {
          "type": "string",
          "description": "Reference to the Test entity."
        },
        "marks": {
          "type": "number",
          "description": "The marks obtained by the student on the test."
        }
      },
      "required": [
        "studentId",
        "teacherId",
        "testId",
        "marks"
      ]
    }
  },
  "auth": {
    "providers": [
      "password",
      "anonymous",
      "google.com"
    ]
  },
  "firestore": {
    "structure": [
      {
        "path": "/users/{userId}",
        "definition": {
          "entityName": "User",
          "schema": {
            "$ref": "#/entities/User"
          },
          "description": "Stores public user profiles (tutors, students, parents)."
        }
      },
      {
        "path": "/teachers/{teacherId}",
        "definition": {
          "entityName": "Teacher",
          "schema": {
            "$ref": "#/entities/Teacher"
          },
          "description": "Stores teacher-specific private data."
        }
      },
      {
        "path": "/enrollments/{enrollmentId}",
        "definition": {
          "entityName": "Enrollment",
          "schema": {
            "$ref": "#/entities/Enrollment"
          },
          "description": "Stores the many-to-many relationship between students and teachers."
        }
      },
      {
        "path": "/studyMaterials/{studyMaterialId}",
        "definition": {
          "entityName": "StudyMaterial",
          "schema": {
            "$ref": "#/entities/StudyMaterial"
          },
          "description": "Stores study materials uploaded by teachers."
        }
      },
      {
        "path": "/attendances/{attendanceId}",
        "definition": {
          "entityName": "Attendance",
          "schema": {
            "$ref": "#/entities/Attendance"
          },
          "description": "Stores attendance records."
        }
      },
      {
        "path": "/performances/{performanceId}",
        "definition": {
          "entityName": "Performance",
          "schema": {
            "$ref": "#/entities/Performance"
          },
          "description": "Stores student performance data."
        }
      }
    ]
  }
}
```
- firestore.rules:
```rules
/**
 * Core Philosophy: This ruleset enforces a role-based security model for an educational application. Access is primarily determined by a user's role (teacher, student, parent) and their relationships to specific data entities. The guiding principle is "Authorization Independence," where authorization context (like a teacher's or student's user ID) is denormalized onto documents to create fast, secure, and understandable rules that avoid complex joins.
 *
 * Data Structure: The database uses a flat structure with top-level collections for each major entity (users, teachers, students, studyMaterials, etc.). Relationships are established through denormalized ID fields within documents (e.g., a `StudyMaterial` document contains the `teacherId` of its author). This structure is optimized for security rule performance.
 *
 * Key Security Decisions:
 * - User Isolation: A user can only access their own user profile document. Listing or browsing other users is disabled.
 * - Role-Based Ownership: Teachers are the owners of educational content like Study Materials, Tests, and Class Schedules. They have exclusive write access to this content.
 * - Shared Access for Student Data: Data specific to a student, such as Attendance and Performance records, is accessible only by the student themselves and the associated teacher. Access for parents is not implemented due to schema limitations and is denied by default for security.
 * - Student Submissions: Students have the authority to create and delete their own submissions (e.g., DPPSubmissions), while teachers can view and manage them.
 * - Public vs. Private Content: The `studyMaterials` collection contains a mix of public and private content, controlled by an `isFree` boolean flag. Reads are allowed for free content, but writes are always restricted to the owner teacher.
 * - Restricted Listing: To prevent data leakage and ensure performance, broad `list` operations are disabled on most collections. Clients are expected to fetch data via known document IDs or through specific, secure queries.
 */
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // --------------------------------
    // Helper Functions
    // --------------------------------

    /**
     * Checks if a user is authenticated.
     */
    function isSignedIn() {
      return request.auth != null;
    }

    /**
     * Checks if the authenticated user's UID matches the provided userId.
     * This is the fundamental check for document ownership.
     */
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }
    
    /**
     * Checks if the document being accessed already exists.
     * CRITICAL for all update and delete operations to prevent acting on non-existent data.
     */
    function isExistingDoc() {
      return resource != null;
    }

    /**
     * Checks if the user associated with a role-specific document (e.g., a Teacher or Student doc)
     * is the currently authenticated user. This requires a `get` call to resolve the relationship.
     */
    function userOwnsRoleDoc(collectionName, docId) {
      return isSignedIn() && get(/databases/$(database)/documents/$(collectionName)/$(docId)).data.userId == request.auth.uid;
    }
    
    /**
     * A specific helper to check if the current user is the teacher associated with a given document.
     * The document must have a `teacherId` field.
     */
    function isTeacherOwner(docData) {
      return userOwnsRoleDoc('teachers', docData.teacherId);
    }
    
    /**
     * A specific helper to check if the current user is the student associated with a given document.
     * The document must have a `studentId` field.
     */
    function isStudentOwner(docData) {
      return userOwnsRoleDoc('students', docData.studentId);
    }

    /**
     * Checks if the current user is the teacher associated with a DPP submission.
     * This requires a multi-step lookup: Submission -> StudyMaterial -> Teacher.
     */
    function isTeacherOfDppSubmission(submissionData) {
      let studyMaterial = get(/databases/$(database)/documents/studyMaterials/$(submissionData.studyMaterialId)).data;
      return userOwnsRoleDoc('teachers', studyMaterial.teacherId);
    }

    // --------------------------------
    // Collection Rules
    // --------------------------------

    /**
     * @description Controls access to user profile documents.
     * @path /users/{userId}
     * @allow A signed-in user (create)s, (get)s, or (update)s their own user document. `request.auth.uid == userId`.
     * @deny An anonymous user tries to read a user document.
     * @deny A signed-in user tries to (list) or (delete) any user document, including their own.
     * @principle Restricts access to a user's own data tree.
     */
    match /users/{userId} {
      allow get, update: if isOwner(userId);
      allow create: if isOwner(userId) && request.resource.data.id == userId;
      allow list: if false;
      allow delete: if false;
    }

    /**
     * @description Controls access to teacher-specific profile data.
     * @path /teachers/{teacherId}
     * @allow A user (create)s a teacher profile for themselves (`request.resource.data.userId == request.auth.uid`).
     * @deny A user tries to (update) or (delete) another user's teacher profile.
     * @deny Any user tries to (list) all teachers.
     * @principle Validates relational integrity between the user and their role-specific document.
     */
    match /teachers/{teacherId} {
      allow get, update: if isExistingDoc() && userOwnsRoleDoc('teachers', teacherId);
      allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;
      allow delete: if isExistingDoc() && userOwnsRoleDoc('teachers', teacherId);
      allow list: if false;
    }

    /**
     * @description Controls access to student-specific profile data.
     * @path /students/{studentId}
     * @allow A user (create)s a student profile for themselves (`request.resource.data.userId == request.auth.uid`).
     * @deny A user tries to (get) or (update) another user's student profile.
     * @deny Any user tries to (list) all students.
     * @principle Validates relational integrity between the user and their role-specific document.
     */
    match /students/{studentId} {
      allow get, update: if isExistingDoc() && userOwnsRoleDoc('students', studentId);
      allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;
      allow delete: if isExistingDoc() && userOwnsRoleDoc('students', studentId);
      allow list: if false;
    }

    /**
     * @description Controls access to parent-specific profile data.
     * @path /parents/{parentId}
     * @allow A user (create)s a parent profile for themselves (`request.resource.data.userId == request.auth.uid`).
     * @deny A user tries to (get) or (update) another user's parent profile.
     * @deny Any user tries to (list) all parents.
     * @principle Validates relational integrity between the user and their role-specific document.
     */
    match /parents/{parentId} {
      allow get, update: if isExistingDoc() && userOwnsRoleDoc('parents', parentId);
      allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;
      allow delete: if isExistingDoc() && userOwnsRoleDoc('parents', parentId);
      allow list: if false;
    }

    /**
     * @description Controls the student-teacher connection records.
     * @path /enrollments/{enrollmentId}
     * @allow A student (create)s their own enrollment request.
     * @allow A student can (list) their own enrollments. A teacher can (list) their own enrollments.
     * @allow The student or the teacher can (get) or (update) an enrollment record.
     * @principle Enforces that users can only manage their own connection records.
     */
    match /enrollments/{enrollmentId} {
      allow get, update: if isExistingDoc() && (isOwner(resource.data.studentId) || isOwner(resource.data.teacherId));
      allow list: if isSignedIn()
                  && (('studentId' in request.query.where) && (request.query.where.studentId == request.auth.uid)
                  || (('teacherId' in request.query.where) && (request.query.where.teacherId == request.auth.uid)));
      allow create: if isSignedIn() && request.resource.data.studentId == request.auth.uid;
      allow delete: if isExistingDoc() && isOwner(resource.data.studentId);
    }
    
    /**
     * @description Controls access to study materials.
     * @path /studyMaterials/{studyMaterialId}
     * @allow Any signed-in user can (list) all study materials.
     * @allow A user can (get) a study material if it is marked as free (`isFree == true`) OR if they are the owner teacher.
     * @deny A user who is not the owner teacher tries to (create), (update), or (delete) a study material.
     * @principle Implements public read for some documents and enforces document ownership for writes.
     */
    match /studyMaterials/{studyMaterialId} {
      allow get: if (isExistingDoc() && resource.data.isFree == true) || isTeacherOwner(resource.data);
      allow list: if isSignedIn();
      allow create: if isSignedIn() && isTeacherOwner(request.resource.data);
      allow update: if isExistingDoc() && isTeacherOwner(resource.data);
      allow delete: if isExistingDoc() && isTeacherOwner(resource.data);
    }

    /**
     * @description Controls access to student attendance records. Access for parents is denied by default.
     * @path /attendances/{attendanceId}
     * @allow A teacher can (create), (get), (update), or (delete) an attendance record they are associated with.
     * @allow A student can (get) their own attendance record.
     * @deny A student tries to (update) their own attendance.
     * @deny A parent tries to access the record. // TODO: Denormalize parent UIDs onto this record for parent access.
     * @principle Enforces shared access for reads between related roles (teacher, student) and owner-only access for writes.
     */
    match /attendances/{attendanceId} {
      allow get: if isTeacherOwner(resource.data) || isStudentOwner(resource.data);
      allow list: if false;
      allow create: if isSignedIn() && isTeacherOwner(request.resource.data);
      allow update, delete: if isExistingDoc() && isTeacherOwner(resource.data);
    }

    /**
     * @description Controls access to tests created by teachers.
     * @path /tests/{testId}
     * @allow The owner teacher can perform any action (create, read, update, delete) on their own test.
     * @deny Any user who is not the owner teacher tries to access or modify a test.
     * @deny Any user can (list) all tests.
     * @principle Enforces strict document ownership for all operations.
     */
    match /tests/{testId} {
      allow get: if isTeacherOwner(resource.data);
      allow list: if false;
      allow create: if isSignedIn() && isTeacherOwner(request.resource.data);
      allow update, delete: if isExistingDoc() && isTeacherOwner(resource.data);
    }

    /**
     * @description Controls access to student performance records on tests.
     * @path /performances/{performanceId}
     * @allow A teacher can (create) and (read) a performance record.
     * @allow A student can (read) their own performance record.
     * @deny A user who is not the student or teacher tries to read the record.
     * @deny Any writes are currently denied. // CRITICAL: The 'Performance' entity is missing a 'teacherId' field for secure write validation.
     * @principle Enforces shared access for reads. Writes are disabled pending schema correction.
     */
    match /performances/{performanceId} {
      allow get: if isStudentOwner(resource.data); // NOTE: Teacher access requires `teacherId` on the document.
      allow list: if false;
      allow create, update, delete: if false; // TODO: Add teacher validation once the schema is updated with a `teacherId` field.
    }

    /**
     * @description Controls access to Daily Practice Problem (DPP) submissions.
     * @path /dPPSubmissions/{dPPSubmissionId}
     * @allow A student can (create) and (delete) their own submission.
     * @allow The student and the relevant teacher can (get) and (update) the submission.
     * @deny A user who is not the submitting student or the material's teacher tries to access the record.
     * @principle Enforces a collaborative model where students create/delete and teachers manage/review.
     */
    match /dPPSubmissions/{dPPSubmissionId} {
      allow get, update: if (isExistingDoc() && isStudentOwner(resource.data)) || isTeacherOfDppSubmission(resource.data);
      allow list: if false;
      allow create: if isSignedIn() && isStudentOwner(request.resource.data);
      allow delete: if isExistingDoc() && isStudentOwner(resource.data);
    }

    /**
     * @description Controls access to class schedules created by teachers.
     * @path /classSchedules/{classScheduleId}
     * @allow The owner teacher can perform any action (create, read, update, delete) on their own schedule.
     * @deny Any user who is not the owner teacher tries to access or modify a schedule.
     * @deny Any user can (list) all class schedules.
     * @principle Enforces strict document ownership for all operations.
     */
    match /classSchedules/{classScheduleId} {
      allow get: if isTeacherOwner(resource.data);
      allow list: if false;
      allow create: if isSignedIn() && isTeacherOwner(request.resource.data);
      allow update, delete: if isExistingDoc() && isTeacherOwner(resource.data);
    }
  }
}
```
- next.config.ts:
```ts
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
```
- package.json:
```json
{
  "name": "nextn",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack -p 9002",
    "genkit:dev": "genkit start -- tsx src/ai/dev.ts",
    "genkit:watch": "genkit start -- tsx --watch src/ai/dev.ts",
    "build": "NODE_ENV=production next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@genkit-ai/google-genai": "^1.20.0",
    "@genkit-ai/next": "^1.20.0",
    "@hookform/resolvers": "^4.1.3",
    "@radix-ui/react-accordion": "^1.2.3",
    "@radix-ui/react-alert-dialog": "^1.1.6",
    "@radix-ui/react-avatar": "^1.1.3",
    "@radix-ui/react-checkbox": "^1.1.4",
    "@radix-ui/react-collapsible": "^1.1.11",
    "@radix-ui/react-dialog": "^1.1.6",
    "@radix-ui/react-dropdown-menu": "^2.1.6",
    "@radix-ui/react-label": "^2.1.2",
    "@radix-ui/react-menubar": "^1.1.6",
    "@radix-ui/react-popover": "^1.1.6",
    "@radix-ui/react-progress": "^1.1.2",
    "@radix-ui/react-radio-group": "^1.2.3",
    "@radix-ui/react-scroll-area": "^1.2.3",
    "@radix-ui/react-select": "^2.1.6",
    "@radix-ui/react-separator": "^1.1.2",
    "@radix-ui/react-slider": "^1.2.3",
    "@radix-ui/react-slot": "^1.2.3",
    "@radix-ui/react-switch": "^1.1.3",
    "@radix-ui/react-tabs": "^1.1.3",
    "@radix-ui/react-toast": "^1.2.6",
    "@radix-ui/react-tooltip": "^1.1.8",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "date-fns": "^3.6.0",
    "dotenv": "^16.5.0",
    "embla-carousel-react": "^8.6.0",
    "firebase": "^11.9.1",
    "genkit": "^1.20.0",
    "lucide-react": "^0.475.0",
    "next": "15.5.9",
    "patch-package": "^8.0.0",
    "react": "^19.2.1",
    "react-day-picker": "^9.11.3",
    "react-dom": "^19.2.1",
    "react-hook-form": "^7.54.2",
    "recharts": "^2.15.1",
    "tailwind-merge": "^3.0.1",
    "tailwindcss-animate": "^1.0.7",
    "uuid": "^10.0.0",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^19.2.1",
    "@types/react-dom": "^19.2.1",
    "@types/uuid": "^10.0.0",
    "genkit-cli": "^1.20.0",
    "postcss": "^8",
    "tailwindcss": "^3.4.1",
    "typescript": "^5"
  }
}
```
- src/ai/dev.ts:
```ts
// Flows will be imported for their side effects in this file.
```
- src/ai/genkit.ts:
```ts
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash',
});
```
- src/app/dashboard/layout.tsx:
```tsx
'use client';

import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { DashboardNav } from '@/components/dashboard-nav';
import { teacherData, studentData, parentData } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, User } from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';

type Role = 'teacher' | 'student' | 'parent';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();

  const getRole = (): Role => {
    if (pathname.startsWith('/dashboard/teacher')) return 'teacher';
    if (pathname.startsWith('/dashboard/student')) return 'student';
    if (pathname.startsWith('/dashboard/parent')) return 'parent';
    return 'student'; // default
  };

  const role = getRole();

  const getDisplayName = () => user?.displayName || user?.email?.split('@')[0] || 'User';
  const getAvatarFallback = () => (user?.displayName || user?.email || 'U').charAt(0).toUpperCase();

  // The parent dashboard is a special case that doesn't need a sidebar nav
  const showSidebar = role !== 'parent';


  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        {showSidebar && (
            <Sidebar>
            <div className="flex flex-col h-full">
                <SidebarHeader className="p-4 border-b">
                <Link href="/" className="flex items-center gap-2">
                    <Icons.logo className="h-6 w-6 text-primary" />
                    <h1 className="text-xl font-bold font-headline">EduConnect Pro</h1>
                </Link>
                </SidebarHeader>
                <SidebarContent className="flex-1 overflow-y-auto">
                <DashboardNav role={role} />
                </SidebarContent>
                <div className="p-4 border-t">
                {isUserLoading ? (
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex flex-col gap-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                ) : user ? (
                  <div className="flex items-center gap-3">
                      <Avatar>
                      <AvatarImage src={user.photoURL || undefined} alt={getDisplayName()} />
                      <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                      <span className="font-semibold text-sm">{getDisplayName()}</span>
                      <span className="text-xs text-muted-foreground capitalize">{role}</span>
                      </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback><User /></AvatarFallback>
                    </Avatar>
                     <div className="flex flex-col">
                      <span className="font-semibold text-sm">Not logged in</span>
                    </div>
                  </div>
                )}
                </div>
            </div>
            </Sidebar>
        )}
        <SidebarInset>
          <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b">
            <div className="container mx-auto flex h-16 items-center justify-between px-6">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="md:hidden" />
                <h2 className="text-2xl font-semibold font-headline hidden sm:block">
                  Dashboard
                </h2>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon">
                  <Bell className="h-5 w-5" />
                  <span className="sr-only">Notifications</span>
                </Button>
                {isUserLoading ? (
                  <Skeleton className="h-10 w-10 rounded-full" />
                ) : user ? (
                  <Avatar>
                    <AvatarImage src={user.photoURL || undefined} alt={getDisplayName()} />
                    <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
                  </Avatar>
                ) : (
                   <Avatar>
                      <AvatarFallback><User /></AvatarFallback>
                    </Avatar>
                )}
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
```
- src/app/dashboard/page.tsx:
```tsx
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, BookOpenCheck, Shield } from 'lucide-react';
import Link from 'next/link';

const roles = [
    {
        name: 'Teacher',
        icon: <User className="h-8 w-8 text-primary" />,
        description: 'Manage students, materials, and schedules.',
        href: '/dashboard/teacher'
    },
    {
        name: 'Student',
        icon: <BookOpenCheck className="h-8 w-8 text-primary" />,
        description: 'Access your materials, grades, and schedule.',
        href: '/dashboard/student'
    },
    {
        name: 'Parent',
        icon: <Shield className="h-8 w-8 text-primary" />,
        description: "Monitor your child's academic progress.",
        href: '/dashboard/parent'
    }
]

export default function DashboardPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-grid-pattern">
        <div className="container max-w-5xl space-y-8">
            <div className="text-center">
                <h1 className="text-4xl font-bold font-headline">Select Your Dashboard</h1>
                <p className="text-muted-foreground mt-2">Choose your role to view the corresponding dashboard experience.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
                {roles.map(role => (
                    <Card key={role.name} className="text-center hover:shadow-xl transition-shadow duration-300">
                        <CardHeader className="items-center">
                            {role.icon}
                            <CardTitle className="mt-4 font-headline">{role.name}</CardTitle>
                        </CardHeader>
                        <CardDescription>{role.description}</CardDescription>
                        <CardFooter className="mt-4">
                             <Button asChild className="w-full">
                                <Link href={role.href}>View Dashboard</Link>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    </div>
  );
}
```
- src/app/dashboard/parent/page.tsx:
```tsx
'use client';

import { useMemo, useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  ClipboardList,
  Pencil,
  CheckCircle,
  BookOpen,
  CalendarCheck2,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { parentData, studentData as childData, teacherData } from '@/lib/data';

const PerformanceChart = dynamic(
  () => import('@/components/performance-chart').then((mod) => mod.PerformanceChart),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[250px] w-full" />,
  }
);


const materialIcons: Record<string, JSX.Element> = {
  Notes: <FileText className="h-5 w-5 text-blue-500" />,
  DPP: <ClipboardList className="h-5 w-5 text-orange-500" />,
  Test: <Pencil className="h-5 w-5 text-purple-500" />,
  Solution: <CheckCircle className="h-5 w-5 text-green-500" />,
};

export default function ParentDashboardPage() {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulate data fetching
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    // We use the teacher's data as the source of truth for the child's progress
    const performanceData = teacherData.performance;
    const studyMaterials = teacherData.studyMaterials;
    const attendancePercentage = childData.stats.attendance; // Assuming this is calculated elsewhere

  if (isLoading) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Skeleton className="h-9 w-64" />
                    <Skeleton className="h-5 w-80 mt-2" />
                </div>
                <Skeleton className="h-16 w-16 rounded-full" />
            </div>
            <Separator />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-32 w-full rounded-xl" />
                <Skeleton className="h-32 w-full rounded-xl" />
                <Skeleton className="h-32 w-full rounded-xl" />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
                <Skeleton className="h-[350px] w-full rounded-xl" />
                <Skeleton className="h-[350px] w-full rounded-xl" />
            </div>
        </div>
    )
  }


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold font-headline">Parent Dashboard</h1>
            <p className="text-muted-foreground">
            Viewing progress for <span className="font-semibold text-primary">{childData.name}</span>.
            </p>
        </div>
        <Avatar className="h-16 w-16 border-2 border-primary/50">
            <AvatarImage src={childData.avatarUrl} alt={childData.name} />
            <AvatarFallback>{childData.name?.charAt(0)}</AvatarFallback>
        </Avatar>
      </div>
      
      <Separator />

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Attendance</CardTitle>
            <CalendarCheck2 className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendancePercentage}%</div>
            <p className="text-xs text-muted-foreground">Excellent attendance record.</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New DPPs</CardTitle>
            <ClipboardList className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{studyMaterials.filter(m => m.type === 'DPP' && m.isNew).length}</div>
            <p className="text-xs text-muted-foreground">New practice papers available.</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Submissions</CardTitle>
            <Pencil className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{childData.stats.pendingSubmissions}</div>
            <p className="text-xs text-muted-foreground">Assignments to be completed.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Performance Chart */}
        <PerformanceChart data={performanceData} />

        {/* Recent Activity */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle>Recent Materials</CardTitle>
            <CardDescription>Latest study materials uploaded by the teacher.</CardDescription>
          </CardHeader>
          <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studyMaterials.slice(0, 4).map((material) => (
                    <TableRow key={material.id}>
                      <TableCell className="font-medium">{materialIcons[material.type] || <BookOpen />}</TableCell>
                      <TableCell>
                        <div className="font-medium">{material.title}</div>
                        {material.isNew && <Badge variant="outline" className="text-accent border-accent">New</Badge>}
                      </TableCell>
                      <TableCell>{material.subject}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{material.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```
- src/app/dashboard/student/daily-practice/page.tsx:
```tsx
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, ClipboardList } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

type StudyMaterial = {
    id: string;
    title: string;
    subject: string;
    type: string;
    createdAt: { toDate: () => Date };
}

export default function DailyPracticePage() {
  const firestore = useFirestore();

  const dppQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'studyMaterials'), where('type', '==', 'DPP'), orderBy('createdAt', 'desc'));
  }, [firestore]);
  
  const { data: dailyPracticePapers, isLoading } = useCollection<StudyMaterial>(dppQuery);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
        <ClipboardList className="w-8 h-8"/>
        Daily Practice
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Daily Practice Papers (DPPs)</CardTitle>
          <CardDescription>Stay sharp with these daily exercises from your teacher.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell colSpan={4}><Skeleton className="h-10 w-full"/></TableCell>
                    </TableRow>
                ))}
                {dailyPracticePapers?.map((paper) => (
                  <TableRow key={paper.id}>
                    <TableCell>
                      <div className="font-medium">{paper.title}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{paper.subject}</Badge>
                    </TableCell>
                    <TableCell>{paper.createdAt.toDate().toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                        <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {!isLoading && dailyPracticePapers?.length === 0 && <p className="text-center text-muted-foreground py-8">No practice papers available yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
```
- src/app/dashboard/student/page.tsx:
```tsx
'use client';

import { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ConnectTeacherForm } from '@/components/connect-teacher-form';
import { Button } from '@/components/ui/button';
import { ArrowRight, Clock, User as UserIcon } from 'lucide-react';
import {
  useUser,
  useFirestore,
  useCollection,
  useMemoFirebase,
  useDoc,
} from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { collection, query, where, doc } from 'firebase/firestore';
import Link from 'next/link';

type Enrollment = {
  id: string;
  teacherId: string;
  status: 'pending' | 'approved' | 'denied';
};

type TeacherProfile = {
  name: string;
  avatarUrl?: string;
};

function ApprovedTeacherCard({ enrollment }: { enrollment: Enrollment }) {
  const firestore = useFirestore();
  const teacherQuery = useMemoFirebase(
    () =>
      firestore ? doc(firestore, 'users', enrollment.teacherId) : null,
    [firestore, enrollment.teacherId]
  );
  const { data: teacher, isLoading: isLoadingTeacher } =
    useDoc<TeacherProfile>(teacherQuery);

  if (isLoadingTeacher) {
    return <Skeleton className="h-24 w-full" />;
  }

  if (!teacher) {
    return null;
  }

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={teacher.avatarUrl} alt={teacher.name} />
            <AvatarFallback>{teacher.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-xl font-headline">
              {teacher.name}
            </CardTitle>
            <CardDescription>
              Status:{' '}
              <span className="text-primary font-semibold">Connected</span>
            </CardDescription>
          </div>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/dashboard/student/teacher/${enrollment.teacherId}`}>
            View Updates <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
    </Card>
  );
}

export default function StudentDashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const enrollmentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'enrollments'),
      where('studentId', '==', user.uid)
    );
  }, [firestore, user]);

  const { data: enrollments, isLoading: isLoadingEnrollments } =
    useCollection<Enrollment>(enrollmentsQuery);

  const approvedEnrollments = useMemo(
    () => enrollments?.filter((e) => e.status === 'approved') || [],
    [enrollments]
  );
  const pendingEnrollments = useMemo(
    () => enrollments?.filter((e) => e.status === 'pending') || [],
    [enrollments]
  );

  if (isUserLoading || isLoadingEnrollments) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">
          {user ? `Welcome back, ${user.displayName || 'Student'}!` : 'Student Dashboard'}
        </h1>
        <p className="text-muted-foreground">
          {approvedEnrollments.length > 0
            ? 'View updates from your connected teachers or connect with a new one.'
            : 'Connect with a teacher to get started.'}
        </p>
      </div>

      {user && (
        <div className="space-y-6">
          {approvedEnrollments.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">My Teachers</h2>
              {approvedEnrollments.map((enrollment) => (
                <ApprovedTeacherCard
                  key={enrollment.id}
                  enrollment={enrollment}
                />
              ))}
            </div>
          )}

          {pendingEnrollments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Pending Connections</CardTitle>
                <CardDescription>
                  These teachers have not approved your connection request yet.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {pendingEnrollments.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center gap-2 p-2 bg-muted/50 rounded-md"
                    >
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">
                        Request sent to Teacher ID: ...{p.teacherId.slice(-6)}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card id="connect">
            <CardHeader>
              <CardTitle className="text-lg">
                Connect with a New Teacher
              </CardTitle>
              <CardDescription className="text-sm">
                Enter a teacher's unique code to send a connection request.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ConnectTeacherForm onConnectionSuccess={() => {}} />
            </CardContent>
          </Card>
        </div>
      )}

      {!user && (
        <Card className="text-center">
          <CardHeader>
            <UserIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <CardTitle>Log In to View Your Dashboard</CardTitle>
            <CardDescription>
              To connect with teachers and see your personalized content, please
              log in or create an account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/login">Log In / Sign Up</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```
- src/app/dashboard/student/study-material/page.tsx:
```tsx
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  ClipboardList,
  Pencil,
  CheckCircle,
  Download,
  BookOpenCheck,
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

const materialIcons: Record<string, JSX.Element> = {
  Notes: <FileText className="h-5 w-5 text-blue-500" />,
  DPP: <ClipboardList className="h-5 w-5 text-orange-500" />,
  Test: <Pencil className="h-5 w-5 text-purple-500" />,
  Solution: <CheckCircle className="h-5 w-5 text-green-500" />,
};

type StudyMaterial = {
    id: string;
    title: string;
    subject: string;
    type: string;
    createdAt: { toDate: () => Date };
    isFree: boolean;
}

export default function StudyMaterialPage() {
  const firestore = useFirestore();

  const materialsQuery = useMemoFirebase(() => {
    if(!firestore) return null;
    return query(collection(firestore, 'studyMaterials'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: studyMaterials, isLoading } = useCollection<StudyMaterial>(materialsQuery);

  return (
    <div className="space-y-6">
        <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
            <BookOpenCheck className="w-8 h-8"/>
            Study Materials
        </h1>
        <Card className="shadow-lg">
        <CardHeader>
            <CardTitle>All Study Materials</CardTitle>
            <CardDescription>Browse and download notes, DPPs, tests, and more from your teacher.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {isLoading && Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell colSpan={4}><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                ))}
                {studyMaterials?.map((material) => (
                    <TableRow key={material.id}>
                    <TableCell className="font-medium">{materialIcons[material.type]}</TableCell>
                    <TableCell>
                        <div className="font-medium">{material.title}</div>
                        <div className="text-sm text-muted-foreground">{material.createdAt.toDate().toLocaleDateString()}</div>
                    </TableCell>
                    <TableCell><Badge variant={material.isFree ? "default" : "secondary"} className={material.isFree ? "bg-accent text-accent-foreground" : ""}>{material.subject}</Badge></TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="icon">
                        <Download className="h-4 w-4" />
                        </Button>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            {!isLoading && studyMaterials?.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No study materials found.</p>
            )}
        </CardContent>
        </Card>
    </div>
  );
}
```
- src/app/dashboard/student/teacher/[teacherId]/page.tsx:
```tsx
'use client';

import { useMemo, useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  ClipboardList,
  Pencil,
  CheckCircle,
  Download,
  BookOpenCheck,
  CalendarDays,
  BarChart3,
  ArrowLeft,
  Video,
  MapPin,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { notFound, useParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { PerformanceChart } from '@/components/performance-chart';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, doc, Timestamp } from 'firebase/firestore';


const materialIcons: Record<string, JSX.Element> = {
  Notes: <FileText className="h-5 w-5 text-blue-500" />,
  DPP: <ClipboardList className="h-5 w-5 text-orange-500" />,
  Test: <Pencil className="h-5 w-5 text-purple-500" />,
  Solution: <CheckCircle className="h-5 w-5 text-green-500" />,
};

type UserProfile = {
  name: string;
  avatarUrl?: string;
  subjects?: string[];
}

type StudyMaterial = {
    id: string;
    title: string;
    type: string;
    subject: string;
    createdAt: Timestamp;
    isNew?: boolean;
}

type ScheduleItem = {
    id: string;
    topic: string;
    subject: string;
    date: Timestamp;
    time: string;
    type: 'Online' | 'Offline';
    locationOrLink: string;
    status: 'Scheduled' | 'Canceled';
}

type PerformanceItem = {
    name: string;
    score: number;
}


export default function TeacherUpdatesPage() {
  const params = useParams();
  const teacherId = params.teacherId as string;
  const firestore = useFirestore();

  const teacherQuery = useMemoFirebase(() => firestore ? doc(firestore, 'users', teacherId) : null, [firestore, teacherId]);
  const { data: teacher, isLoading: isLoadingTeacher } = useDoc<UserProfile>(teacherQuery);
  
  const materialsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'studyMaterials'), where('teacherId', '==', teacherId), orderBy('createdAt', 'desc')) : null, [firestore, teacherId]);
  const { data: studyMaterials, isLoading: isLoadingMaterials } = useCollection<StudyMaterial>(materialsQuery);
  
  const scheduleQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'classSchedules'), where('teacherId', '==', teacherId), orderBy('date', 'asc')) : null, [firestore, teacherId]);
  const { data: schedule, isLoading: isLoadingSchedule } = useCollection<ScheduleItem>(scheduleQuery);
  
  const performanceQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'performances'), where('teacherId', '==', teacherId), orderBy('date', 'desc')) : null, [firestore, teacherId]);
  const { data: performance, isLoading: isLoadingPerformance } = useCollection<PerformanceItem>(performanceQuery);


  const performanceChartData = useMemo(() => 
    performance?.map(p => ({ name: p.name, score: p.score })) || []
  , [performance]);

  const isLoading = isLoadingTeacher || isLoadingMaterials || isLoadingSchedule || isLoadingPerformance;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!teacher) {
    return notFound();
  }

  return (
    <div className="space-y-6">
        <div>
            <Button variant="ghost" asChild className="mb-4">
                <Link href="/dashboard/student">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to My Teachers
                </Link>
            </Button>
            <div className="flex items-center gap-4">
                 <Avatar className="h-20 w-20 border">
                    <AvatarImage src={teacher.avatarUrl} alt={teacher.name} />
                    <AvatarFallback className="text-2xl">{teacher.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="text-sm text-muted-foreground">Viewing updates from</p>
                    <h1 className="text-3xl font-bold font-headline">{teacher.name}</h1>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><CalendarDays className="w-5 h-5" /> Upcoming Classes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {schedule?.map(item => (
                        <div key={item.id} className={cn("flex items-start justify-between p-4 border rounded-lg", item.status === 'Canceled' && 'bg-muted/50 opacity-70')}>
                            <div className="flex items-start gap-4">
                                <div className="flex flex-col items-center justify-center p-2 text-sm font-semibold text-center rounded-md w-16 bg-primary/10 text-primary">
                                    <span>{item.date.toDate().toLocaleDateString('en-US', { day: '2-digit' })}</span>
                                    <span>{item.date.toDate().toLocaleDateString('en-US', { month: 'short' })}</span>
                                </div>
                                <div>
                                    <h3 className="font-semibold">{item.topic}</h3>
                                    <p className="text-sm text-muted-foreground">{item.subject} • {item.time}</p>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                        {item.type === 'Online' ? <Video className="h-4 w-4"/> : <MapPin className="h-4 w-4"/>}
                                        {item.locationOrLink || 'Not specified'}
                                    </p>
                                </div>
                            </div>
                            {item.status === 'Canceled' ? (
                                <Badge variant="destructive">Canceled</Badge>
                            ) : (
                                <Badge variant="default">Scheduled</Badge>
                            )}
                        </div>
                    ))}
                     {schedule?.length === 0 && <p className="text-center text-muted-foreground py-4">No upcoming classes.</p>}
                </CardContent>
            </Card>
            <PerformanceChart data={performanceChartData} />
        </div>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><BookOpenCheck className="w-5 h-5"/> All Study Materials</CardTitle>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                    {studyMaterials?.map((material) => (
                        <TableRow key={material.id}>
                        <TableCell className="font-medium">{materialIcons[material.type]}</TableCell>
                        <TableCell>
                            <div className="font-medium">{material.title}</div>
                            <div className="text-sm text-muted-foreground">{material.createdAt.toDate().toLocaleDateString()}</div>
                        </TableCell>
                        <TableCell><Badge variant={material.isNew ? "default" : "secondary"} className={material.isNew ? "bg-accent text-accent-foreground" : ""}>{material.subject}</Badge></TableCell>
                        <TableCell className="text-right">
                            <Button variant="ghost" size="icon">
                            <Download className="h-4 w-4" />
                            </Button>
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                {studyMaterials?.length === 0 && <p className="text-center text-muted-foreground py-8">No study materials found.</p>}
            </CardContent>
        </Card>
    </div>
  );
}
```
- src/app/dashboard/teacher/attendance/page.tsx:
```tsx
'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ClipboardCheck, CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, writeBatch, Timestamp, doc } from 'firebase/firestore';


type StudentEnrollment = { id: string; studentName: string, studentId: string; };
type Batch = { id: string; name: string; };

export default function AttendancePage() {
    const { toast } = useToast();
    const { user } = useUser();
    const firestore = useFirestore();

    // Filters
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [selectedBatchId, setSelectedBatchId] = useState('');

    // State
    const [attendance, setAttendance] = useState<Record<string, boolean>>({});
    const [isSaving, setIsSaving] = useState(false);

    const batchesQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'batches'), where('teacherId', '==', user.uid));
    }, [firestore, user]);
    const { data: batches, isLoading: isLoadingBatches } = useCollection<Batch>(batchesQuery);

    const studentsQuery = useMemoFirebase(() => {
        if (!firestore || !user || !selectedBatchId) return null;
        return query(
            collection(firestore, 'enrollments'), 
            where('teacherId', '==', user.uid), 
            where('batchId', '==', selectedBatchId), 
            where('status', '==', 'approved')
        );
    }, [firestore, user, selectedBatchId]);
    const { data: students, isLoading: isLoadingStudents } = useCollection<StudentEnrollment>(studentsQuery);
    
    useEffect(() => {
        if (students) {
            const initialAttendance = students.reduce((acc, student) => {
                acc[student.studentId] = true;
                return acc;
            }, {} as Record<string, boolean>);
            setAttendance(initialAttendance);
        }
    }, [students]);


    const handleAttendanceChange = (studentId: string, isPresent: boolean) => {
        setAttendance(prev => ({ ...prev, [studentId]: isPresent }));
    };

    const handleSaveAttendance = async () => {
        if (!selectedBatchId || !selectedDate || !firestore || !user || !students) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select a date and batch.' });
            return;
        }
        setIsSaving(true);

        const batch = writeBatch(firestore);
        
        students.forEach(student => {
            const isPresent = attendance[student.studentId] ?? false;
            const attendanceRef = doc(collection(firestore, 'attendances'));
            batch.set(attendanceRef, {
                studentId: student.studentId,
                teacherId: user.uid,
                batchId: selectedBatchId,
                date: Timestamp.fromDate(selectedDate),
                isPresent: isPresent,
            });
        });
        
        try {
            await batch.commit();
            toast({ title: 'Attendance Saved', description: `Attendance for ${format(selectedDate, 'PPP')} has been recorded (${Object.values(attendance).filter(Boolean).length}/${students.length} present).` });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error Saving Attendance', description: 'There was a problem saving the attendance records.' });
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
                    <ClipboardCheck className="h-8 w-8"/>
                    Mark Attendance
                </h1>
                <p className="text-muted-foreground">Select a batch and date to mark student attendance.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Select Batch and Date</CardTitle>
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn("w-full sm:w-[280px] justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
                            </PopoverContent>
                        </Popover>
                        <Select onValueChange={setSelectedBatchId} value={selectedBatchId}>
                            <SelectTrigger className="w-full sm:w-[280px]">
                                <SelectValue placeholder="Select a batch" />
                            </SelectTrigger>
                            <SelectContent>
                                {isLoadingBatches && <SelectItem value="" disabled>Loading...</SelectItem>}
                                {batches?.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    {selectedBatchId ? (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Student Name</TableHead>
                                        <TableHead className="text-right">Status (Present / Absent)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoadingStudents && <TableRow><TableCell colSpan={2}><Skeleton className="h-10 w-full" /></TableCell></TableRow>}
                                    {students?.map((student) => (
                                        <TableRow key={student.studentId}>
                                            <TableCell className="font-medium">{student.studentName}</TableCell>
                                            <TableCell className="text-right">
                                                <Switch
                                                    checked={attendance[student.studentId] ?? true}
                                                    onCheckedChange={(checked) => handleAttendanceChange(student.studentId, checked)}
                                                    aria-label={`Mark ${student.studentName} attendance`}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                             {students && students.length > 0 && (
                                <div className="flex justify-end mt-6">
                                    <Button onClick={handleSaveAttendance} disabled={isSaving}>
                                        {isSaving ? 'Saving...' : 'Save Attendance'}
                                    </Button>
                                </div>
                            )}
                             {students?.length === 0 && !isLoadingStudents && <p className="text-center text-muted-foreground py-4">No students found in this batch.</p>}
                        </>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>Please select a batch to view students.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
```
- src/app/dashboard/teacher/batches/page.tsx:
```tsx
'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
  } from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, MoreVertical, Users2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, serverTimestamp, doc, deleteDoc } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Skeleton } from '@/components/ui/skeleton';

type Batch = {
    id: string;
    name: string;
    teacherId: string;
    createdAt: { toDate: () => Date };
};

export default function BatchesPage() {
    const { toast } = useToast();
    const [isCreateBatchOpen, setCreateBatchOpen] = useState(false);
    
    const { user } = useUser();
    const firestore = useFirestore();
    
    const [newBatchName, setNewBatchName] = useState('');

    const batchesQuery = useMemoFirebase(() => {
        if(!firestore || !user) return null;
        return query(collection(firestore, 'batches'), where('teacherId', '==', user.uid), orderBy('createdAt', 'desc'));
    }, [firestore, user]);
    const { data: batches, isLoading } = useCollection<Batch>(batchesQuery);

    const handleCreateBatch = async () => {
        if (!newBatchName || !firestore || !user) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please provide a name for the batch.' });
            return;
        }

        const newBatch = {
            name: newBatchName,
            teacherId: user.uid,
            createdAt: serverTimestamp(),
        };

        const batchesCollection = collection(firestore, 'batches');
        addDocumentNonBlocking(batchesCollection, newBatch);

        toast({ title: 'Batch Created', description: `The batch "${newBatchName}" has been successfully created.`});
        
        setNewBatchName('');
        setCreateBatchOpen(false);
    }

    const handleDeleteBatch = (batchId: string) => {
        if(!firestore) return;
        const batchRef = doc(firestore, 'batches', batchId);
        deleteDocumentNonBlocking(batchRef);
        toast({ title: 'Batch Deleted', description: 'The selected batch has been removed.' });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
                        <Users2 className="h-8 w-8"/>
                        Manage Batches
                    </h1>
                    <p className="text-muted-foreground">Create, view, and manage your student groups.</p>
                </div>
                <Dialog open={isCreateBatchOpen} onOpenChange={setCreateBatchOpen}>
                    <DialogTrigger asChild>
                        <Button><PlusCircle className="mr-2 h-4 w-4"/> Create Batch</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Create New Batch</DialogTitle>
                            <DialogDescription>Enter a name for your new batch. You can assign students later.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">Name*</Label>
                                <Input id="name" value={newBatchName} onChange={e => setNewBatchName(e.target.value)} className="col-span-3" placeholder="e.g. Weekend Maths 2025" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreateBatch}>Create Batch</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Your Batches</CardTitle>
                    <CardDescription>A list of all the student batches you have created.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading && Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-12 mb-2 w-full" />)}
                    {batches && batches.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Batch Name</TableHead>
                                    <TableHead>Created On</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {batches.map((batch) => (
                                    <TableRow key={batch.id}>
                                        <TableCell className="font-medium">{batch.name}</TableCell>
                                        <TableCell>{batch.createdAt?.toDate().toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            <AlertDialog>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem>Edit Name</DropdownMenuItem>
                                                        <DropdownMenuItem>Assign Students</DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <AlertDialogTrigger asChild>
                                                            <DropdownMenuItem className="text-red-600 focus:bg-red-50 focus:text-red-700 !cursor-pointer">
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete Batch
                                                            </DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone. This will permanently delete the batch.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteBatch(batch.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : !isLoading && (
                        <p className="text-sm text-center text-muted-foreground py-8">You haven't created any batches yet.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
```
- src/app/dashboard/teacher/materials/page.tsx:
```tsx
'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, MoreVertical, BookOpenCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, orderBy, serverTimestamp, doc } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Skeleton } from '@/components/ui/skeleton';


type StudyMaterial = {
    id: string;
    title: string;
    description?: string;
    subject: string;
    chapter?: string;
    type: string;
    createdAt: { toDate: () => Date };
    isFree: boolean;
};

type UserProfile = {
  subjects?: string[];
}

const materialTypes = ["Notes", "DPP", "Homework", "Question Bank", "Test Paper", "Solution"];

export default function MaterialsPage() {
    const { toast } = useToast();
    const [isAddMaterialOpen, setAddMaterialOpen] = useState(false);
    
    const { user } = useUser();
    const firestore = useFirestore();

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [subject, setSubject] = useState('');
    const [chapter, setChapter] = useState('');
    const [materialType, setMaterialType] = useState('');
    const [isFree, setIsFree] = useState(false);

    const userProfileQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);
    const { data: userProfile } = useDoc<UserProfile>(userProfileQuery);
    const teacherSubjects = useMemo(() => userProfile?.subjects || [], [userProfile]);

    const materialsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'studyMaterials'), where('teacherId', '==', user.uid), orderBy('createdAt', 'desc'));
    }, [firestore, user]);

    const { data: materials, isLoading } = useCollection<StudyMaterial>(materialsQuery);

    const handleAddMaterial = async () => {
        if (!title || !subject || !materialType || !firestore || !user) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill out all required fields.' });
            return;
        }

        const newMaterial = {
            title,
            description,
            subject,
            chapter,
            type: materialType,
            teacherId: user.uid,
            isFree: isFree,
            createdAt: serverTimestamp(),
            // In a real app, you would handle file uploads and store a URL
            fileUrl: 'https://example.com/placeholder.pdf'
        };
        
        const materialsCollection = collection(firestore, 'studyMaterials');
        addDocumentNonBlocking(materialsCollection, newMaterial);

        toast({ title: 'Material Added', description: `${title} has been successfully uploaded.`});
        
        setTitle('');
        setDescription('');
        setSubject('');
        setChapter('');
        setMaterialType('');
        setIsFree(false);
        setAddMaterialOpen(false);
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
                        <BookOpenCheck className="h-8 w-8"/>
                        Study Materials
                    </h1>
                    <p className="text-muted-foreground">Manage and upload learning resources for your students.</p>
                </div>
                <Dialog open={isAddMaterialOpen} onOpenChange={setAddMaterialOpen}>
                    <DialogTrigger asChild>
                        <Button><PlusCircle className="mr-2 h-4 w-4"/> Add Material</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[480px]">
                        <DialogHeader>
                            <DialogTitle>Add New Study Material</DialogTitle>
                            <DialogDescription>Fill in the details below to upload a new resource.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="title" className="text-right">Title*</Label>
                                <Input id="title" value={title} onChange={e => setTitle(e.target.value)} className="col-span-3" placeholder="e.g. Chapter 1 Notes" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="description" className="text-right">Description</Label>
                                <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} className="col-span-3" placeholder="A brief summary of the material." />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="subject" className="text-right">Subject*</Label>
                                <Select onValueChange={setSubject} value={subject}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select a subject" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {teacherSubjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="chapter" className="text-right">Chapter</Label>
                                <Input id="chapter" value={chapter} onChange={e => setChapter(e.target.value)} className="col-span-3" placeholder="e.g. Chapter 5" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="type" className="text-right">Type*</Label>
                                <Select onValueChange={setMaterialType} value={materialType}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select material type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {materialTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="file" className="text-right">File*</Label>
                                <Input id="file" type="file" className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="isFree" className="text-right">Free?</Label>
                                <Select onValueChange={(v) => setIsFree(v === 'true')} value={String(isFree)}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="false">No (Requires Enrollment)</SelectItem>
                                        <SelectItem value="true">Yes (Public)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleAddMaterial}>Upload Material</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Uploaded Materials</CardTitle>
                    <CardDescription>A list of all the resources you have uploaded.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading && Array.from({length: 4}).map((_, i) => <Skeleton key={i} className="h-12 w-full mb-2" />)}
                    {materials && materials.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Subject</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Access</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {materials.map((material) => (
                                    <TableRow key={material.id}>
                                        <TableCell className="font-medium">{material.title}</TableCell>
                                        <TableCell><Badge variant="outline">{material.type}</Badge></TableCell>
                                        <TableCell>{material.subject}</TableCell>
                                        <TableCell>{material.createdAt?.toDate().toLocaleDateString()}</TableCell>
                                        <TableCell><Badge variant={material.isFree ? 'default' : 'secondary'}>{material.isFree ? 'Public' : 'Private'}</Badge></TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem>Edit</DropdownMenuItem>
                                                    <DropdownMenuItem>Archive</DropdownMenuItem>
                                                    <DropdownMenuItem className="text-red-600 focus:bg-red-50 focus:text-red-700">Delete</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : !isLoading && (
                        <p className="text-sm text-center text-muted-foreground py-8">You haven't uploaded any materials yet.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
```
- src/app/dashboard/teacher/page.tsx:
```tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Users,
  Check,
  X,
  MoreVertical,
  UserCheck,
  Users2,
  PlusCircle,
  DoorOpen,
  Info
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import {
  useUser,
  useFirestore,
  useCollection,
  useDoc,
  useMemoFirebase,
} from '@/firebase';
import { collection, query, where, doc, updateDoc } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

type UserProfile = {
  id: string;
  name: string;
  role: string;
  status: 'pending_verification' | 'approved';
  subjects?: string[];
  batches?: {id: string, name: string}[];
}

type Enrollment = {
    id: string;
    studentId: string;
    studentName?: string;
    studentAvatar?: string;
    teacherId: string;
    status: 'pending' | 'approved' | 'denied';
}

function StudentRequestRow({ enrollment, onUpdate }: { enrollment: Enrollment, onUpdate: () => void }) {
    const firestore = useFirestore();
    const { toast } = useToast();

    const handleApprove = async () => {
        if (!firestore) return;
        const enrollmentRef = doc(firestore, 'enrollments', enrollment.id);
        await updateDoc(enrollmentRef, { status: 'approved' });
        toast({ title: 'Student Approved', description: `${enrollment.studentName} is now enrolled.`});
        onUpdate();
    };

    const handleDeny = async () => {
        if (!firestore) return;
        const enrollmentRef = doc(firestore, 'enrollments', enrollment.id);
        await updateDoc(enrollmentRef, { status: 'denied' });
        toast({ variant: 'destructive', title: 'Request Denied', description: 'The enrollment request has been denied.'});
        onUpdate();
    };

    return (
        <TableRow>
            <TableCell className="font-medium flex items-center gap-3">
            <Avatar>
                <AvatarImage src={enrollment.studentAvatar} />
                <AvatarFallback>{enrollment.studentName?.charAt(0) || 'S'}</AvatarFallback>
            </Avatar>
            {enrollment.studentName}
            </TableCell>
            <TableCell className="text-right space-x-2">
            <Button onClick={handleApprove} variant="outline" size="icon" className="h-8 w-8 text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700">
                <Check className="h-4 w-4" />
            </Button>
            <Button onClick={handleDeny} variant="outline" size="icon" className="h-8 w-8 text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700">
                <X className="h-4 w-4" />
            </Button>
            </TableCell>
        </TableRow>
    )
}

function PendingVerificationCard() {
    return (
        <Card className="bg-amber-50 border-amber-200 shadow-lg">
            <CardHeader className="flex-row items-center gap-4">
                <Info className="h-8 w-8 text-amber-600"/>
                <div>
                    <CardTitle className="text-xl text-amber-800">Profile Under Verification</CardTitle>
                    <CardDescription className="text-amber-700">
                        Your profile has been submitted and is currently being reviewed by the admin. 
                        You will be notified once it is approved.
                    </CardDescription>
                </div>
            </CardHeader>
        </Card>
    )
}


export default function TeacherDashboardPage() {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const [isAddStudentOpen, setAddStudentOpen] = useState(false);
  
  const [newStudentData, setNewStudentData] = useState({
    name: '',
    email: '',
    grade: '',
    subject: '',
    address: '',
    mobileNumber: '',
    batch: '',
  });

  const userProfileQuery = useMemoFirebase(() => {
    if(!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: userProfile, isLoading: isLoadingProfile } = useDoc<UserProfile>(userProfileQuery);


  const enrollmentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'enrollments'), where('teacherId', '==', user.uid));
  }, [firestore, user]);

  const { data: enrollments, isLoading: isLoadingEnrollments, error } = useCollection<Enrollment>(enrollmentsQuery);

  const studentRequests = useMemo(() => enrollments?.filter(e => e.status === 'pending') || [], [enrollments]);
  const enrolledStudents = useMemo(() => enrollments?.filter(e => e.status === 'approved') || [], [enrollments]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setNewStudentData(prev => ({ ...prev, [id]: value }));
  };

   const handleSelectChange = (id: string, value: string) => {
    setNewStudentData(prev => ({ ...prev, [id]: value }));
  };

  const handleAddStudent = () => {
    if (!newStudentData.name || !newStudentData.email || !firestore || !user) {
        toast({ variant: 'destructive', title: 'Missing Information', description: 'Please enter at least a name and email for the student.' });
        return;
    }
    
    const studentId = `manual-${Date.now()}`;
    const studentProfileRef = doc(firestore, 'users', studentId);
    const enrollmentRef = collection(firestore, 'enrollments');
    
    const studentProfileData = {
        name: newStudentData.name,
        email: newStudentData.email,
        role: 'student',
        id: studentId,
        avatarUrl: `https://picsum.photos/seed/${newStudentData.name.replace(/\s/g, '')}/40/40`,
    };

    const enrollmentData = {
        studentId: studentId,
        studentName: newStudentData.name,
        studentAvatar: studentProfileData.avatarUrl,
        teacherId: user.uid,
        status: 'approved'
    };

    addDocumentNonBlocking(enrollmentRef, enrollmentData);

    toast({ title: 'Student Added', description: `${newStudentData.name} has been added to your roster.` });
    
    setNewStudentData({
        name: '', email: '', grade: '', subject: '', address: '', mobileNumber: '', batch: '',
    });
    setAddStudentOpen(false);
  };
  
  const handleRemove = async (enrollmentId: string) => {
    if (!firestore) return;
    const enrollmentRef = doc(firestore, 'enrollments', enrollmentId);
    await updateDoc(enrollmentRef, { status: 'denied' }); // or delete
    toast({ title: 'Student Removed', description: 'The student has been unenrolled.'})
  };
  
  if (isLoadingProfile) {
    return <div className="space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
    </div>
  }

  if (userProfile?.status === 'pending_verification') {
    return (
        <div className="space-y-6">
             <h1 className="text-3xl font-bold font-headline">Teacher Dashboard</h1>
             <PendingVerificationCard />
        </div>
    );
  }


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Teacher Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingEnrollments ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{enrolledStudents?.length || 0}</div>}
            <p className="text-xs text-muted-foreground">Total active students</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingEnrollments ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold text-accent">{studentRequests?.length || 0}</div>}
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Batches</CardTitle>
            <Users2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoadingEnrollments ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{userProfile?.batches?.length || 0}</div>}
            <p className="text-xs text-muted-foreground">Total student groups</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Class Status</CardTitle>
            <DoorOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold"><Badge variant="default">Open</Badge></div>
            <p className="text-xs text-muted-foreground">Your classes are currently open</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Student Enrollment Requests */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Enrollment Requests</CardTitle>
                <CardDescription>Approve or deny new student requests.</CardDescription>
            </div>
            <Button size="sm" variant="outline">View All</Button>
          </CardHeader>
          <CardContent>
            {isLoadingEnrollments && <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>}
            {studentRequests && studentRequests.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentRequests.map((enrollment) => (
                    <StudentRequestRow key={enrollment.id} enrollment={enrollment} onUpdate={() => {}} />
                  ))}
                </TableBody>
              </Table>
            ) : !isLoadingEnrollments && (
              <p className="text-sm text-center text-muted-foreground py-4">No pending requests.</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Jump to common tasks.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
              <Button variant="outline" asChild><Link href="/dashboard/teacher/schedule">Manage Schedule</Link></Button>
              <Button variant="outline" asChild><Link href="/dashboard/teacher/materials">Upload Materials</Link></Button>
              <Button variant="outline" asChild><Link href="/dashboard/teacher/attendance">Take Attendance</Link></Button>
              <Button variant="outline" asChild><Link href="/dashboard/teacher/performance">Enter Marks</Link></Button>
          </CardContent>
        </Card>
      </div>

       {/* Enrolled Students Table */}
       <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>My Students</CardTitle>
              <CardDescription>Manage grades and attendance for enrolled students.</CardDescription>
            </div>
             <Dialog open={isAddStudentOpen} onOpenChange={setAddStudentOpen}>
                <DialogTrigger asChild>
                    <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Student</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle>Add New Student</DialogTitle>
                        <DialogDescription>Enter the student's details to add them to your roster.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Student Name*</Label>
                            <Input id="name" value={newStudentData.name} onChange={handleInputChange} placeholder="e.g., John Smith" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Student Email*</Label>
                            <Input id="email" type="email" value={newStudentData.email} onChange={handleInputChange} placeholder="e.g., john.smith@example.com" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="grade">Class/Grade</Label>
                            <Input id="grade" value={newStudentData.grade} onChange={handleInputChange} placeholder="e.g., 10th Grade" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="subject">Subject</Label>
                             <Select onValueChange={(value) => handleSelectChange('subject', value)} value={newStudentData.subject}>
                                <SelectTrigger><SelectValue placeholder="Select a subject" /></SelectTrigger>
                                <SelectContent>
                                    {userProfile?.subjects?.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="batch">Batch</Label>
                             <Select onValueChange={(value) => handleSelectChange('batch', value)} value={newStudentData.batch}>
                                <SelectTrigger><SelectValue placeholder="Select a batch" /></SelectTrigger>
                                <SelectContent>
                                    {userProfile?.batches?.map(b => <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="mobileNumber">Mobile Number</Label>
                            <Input id="mobileNumber" type="tel" value={newStudentData.mobileNumber} onChange={handleInputChange} placeholder="e.g., 123-456-7890" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Textarea id="address" value={newStudentData.address} onChange={handleInputChange} placeholder="Student's address" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleAddStudent}>Add Student</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
           {isLoadingEnrollments && <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>}
           {enrolledStudents && enrolledStudents.length > 0 ? (
            <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrolledStudents.map((enrollment) => (
                    <TableRow key={enrollment.id}>
                      <TableCell className="font-medium flex items-center gap-3">
                         <Avatar>
                          <AvatarImage src={enrollment.studentAvatar} />
                          <AvatarFallback>{enrollment.studentName?.charAt(0) || 'S'}</AvatarFallback>
                        </Avatar>
                        {enrollment.studentName}
                      </TableCell>
                       <TableCell>
                        <Badge variant="default">{enrollment.status}</Badge>
                       </TableCell>
                      <TableCell className="text-right">
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/teacher/student/${enrollment.studentId}`}>View Profile</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/teacher/performance?studentId=${enrollment.studentId}`}>Enter Marks</Link>
                              </DropdownMenuItem>
                               <DropdownMenuItem asChild>
                                <Link href={`/dashboard/teacher/attendance`}>Mark Attendance</Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleRemove(enrollment.id)} className="text-red-600 focus:bg-red-50 focus:text-red-700">Remove Student</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : !isLoadingEnrollments && (
              <p className="text-sm text-center text-muted-foreground py-8">No students enrolled yet.</p>
            )}
          </CardContent>
        </Card>
    </div>
  );
}
```
- src/app/dashboard/teacher/performance/page.tsx:
```tsx
'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarChart3, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearchParams } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, orderBy, serverTimestamp, doc } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';


type StudentEnrollment = { id: string; studentName: string; studentId: string; };
type TestResult = { 
    id: string; 
    studentId: string;
    studentName: string;
    testName: string;
    subject: string;
    marks: number;
    maxMarks: number;
    date: { toDate: () => Date };
};

type UserProfile = {
    subjects?: string[];
}

export default function PerformancePage() {
    const { toast } = useToast();
    const searchParams = useSearchParams();
    
    const { user } = useUser();
    const firestore = useFirestore();

    // Form state
    const [selectedStudentId, setSelectedStudentId] = useState(searchParams.get('studentId') || '');
    const [testName, setTestName] = useState('');
    const [subject, setSubject] = useState('');
    const [marks, setMarks] = useState<number | ''>('');
    const [maxMarks, setMaxMarks] = useState<number | ''>('');
    
    const userProfileQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);
    const { data: userProfile } = useDoc<UserProfile>(userProfileQuery);
    const teacherSubjects = useMemo(() => userProfile?.subjects || [], [userProfile]);


    const studentsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'enrollments'), where('teacherId', '==', user.uid), where('status', '==', 'approved'));
    }, [firestore, user]);
    const { data: students, isLoading: isLoadingStudents } = useCollection<StudentEnrollment>(studentsQuery);

    const performanceQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'performances'), where('teacherId', '==', user.uid), orderBy('date', 'desc'));
    }, [firestore, user]);
    const { data: testResults, isLoading: isLoadingResults } = useCollection<TestResult>(performanceQuery);


    const handleAddResult = async () => {
        if (!selectedStudentId || !testName || !subject || marks === '' || maxMarks === '' || !firestore || !user) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill out all fields.' });
            return;
        }
        
        const student = students?.find(s => s.studentId === selectedStudentId);

        const newResult = {
            studentId: selectedStudentId,
            studentName: student?.studentName,
            teacherId: user.uid,
            testName,
            subject,
            marks: Number(marks),
            maxMarks: Number(maxMarks),
            date: serverTimestamp(),
        };
        
        const performanceCollection = collection(firestore, 'performances');
        addDocumentNonBlocking(performanceCollection, newResult);

        toast({ title: 'Result Added', description: `Marks for ${testName} have been recorded.`});
        
        // Reset form
        setTestName('');
        setSubject('');
        setMarks('');
        setMaxMarks('');
    }
    
    const displayedResults = useMemo(() => {
        if (!selectedStudentId) return testResults;
        return testResults?.filter(r => r.studentId === selectedStudentId);
    }, [testResults, selectedStudentId]);

    const isLoading = isLoadingStudents || isLoadingResults;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
                        <BarChart3 className="h-8 w-8"/>
                        Student Performance
                    </h1>
                    <p className="text-muted-foreground">Enter and track test results for your students.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Enter Test Marks</CardTitle>
                        <CardDescription>Select a student and enter their latest test score.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="student">Student*</Label>
                            <Select onValueChange={setSelectedStudentId} value={selectedStudentId}>
                                <SelectTrigger id="student"><SelectValue placeholder="Select a student" /></SelectTrigger>
                                <SelectContent>
                                    {isLoadingStudents && <SelectItem value="loading" disabled>Loading...</SelectItem>}
                                    {students?.map(s => <SelectItem key={s.id} value={s.studentId}>{s.studentName}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                         <div>
                            <Label htmlFor="testName">Test Name*</Label>
                            <Input id="testName" value={testName} onChange={e => setTestName(e.target.value)} placeholder="e.g. Unit Test 1" />
                        </div>
                        <div>
                            <Label htmlFor="subject">Subject*</Label>
                             <Select onValueChange={setSubject} value={subject}>
                                <SelectTrigger id="subject"><SelectValue placeholder="Select a subject" /></SelectTrigger>
                                <SelectContent>
                                    {teacherSubjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <Label htmlFor="marks">Marks Obtained*</Label>
                                <Input id="marks" type="number" value={marks} onChange={e => setMarks(Number(e.target.value))} placeholder="e.g. 85" />
                            </div>
                            <div className="flex-1">
                                <Label htmlFor="maxMarks">Max Marks*</Label>
                                <Input id="maxMarks" type="number" value={maxMarks} onChange={e => setMaxMarks(Number(e.target.value))} placeholder="e.g. 100" />
                            </div>
                        </div>
                        <Button onClick={handleAddResult} className="w-full" disabled={!selectedStudentId || isLoading}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Result
                        </Button>
                    </CardContent>
                </Card>
                 <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Test History</CardTitle>
                        <CardDescription>Showing results for {students?.find(s => s.studentId === selectedStudentId)?.studentName || 'all students'}.</CardDescription>
                    </CardHeader>
                    <CardContent>
                    {isLoading && <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>}
                        {displayedResults && displayedResults.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Student</TableHead>
                                        <TableHead>Test Name</TableHead>
                                        <TableHead>Score</TableHead>
                                        <TableHead className="text-right">Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {displayedResults.map((result) => (
                                        <TableRow key={result.id}>
                                            <TableCell className="font-medium">{result.studentName}</TableCell>
                                            <TableCell className="font-medium">{result.testName}</TableCell>
                                            <TableCell className="font-semibold">{result.marks} / {result.maxMarks}</TableCell>
                                            <TableCell className="text-right">{result.date.toDate().toLocaleDateString()}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : !isLoading && (
                            <p className="text-sm text-center text-muted-foreground py-8">No test results found.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
```
- src/app/dashboard/teacher/profile/page.tsx:
```tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User as UserIcon, Book, Briefcase, MapPin, Mail, Phone, Edit, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';

type TeacherProfileData = {
    id: string;
    name: string;
    className?: string;
    subjects?: string[];
    experience?: string;
    experienceType?: string;
    address?: string;
    email: string;
    mobileNumber?: string;
    avatarUrl?: string;
    qualification?: string;
    subjectCategory?: string;
    classLevels?: string[];
};

export default function TeacherProfilePage() {
    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const [isEditOpen, setEditOpen] = useState(false);

    const userProfileQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);

    const { data: teacherProfile, isLoading: isLoadingProfile, error } = useDoc<TeacherProfileData>(userProfileQuery);

    // Form state
    const [name, setName] = useState('');
    const [className, setClassName] = useState('');
    const [subjects, setSubjects] = useState('');
    const [experience, setExperience] = useState('');
    const [address, setAddress] = useState('');
    const [qualification, setQualification] = useState('');

    useEffect(() => {
        if (teacherProfile) {
            setName(teacherProfile.name || '');
            setClassName(teacherProfile.className || 'Your Coaching Center');
            setSubjects(teacherProfile.subjects?.join(', ') || '');
            setExperience(teacherProfile.experience || '');
            setAddress(teacherProfile.address || '');
            setQualification(teacherProfile.qualification || '');
        }
    }, [teacherProfile]);

    const handleProfileUpdate = async () => {
        if (!user || !firestore) {
             toast({ variant: 'destructive', title: 'Error', description: 'User not authenticated.' });
            return
        };

        const userRef = doc(firestore, 'users', user.uid);
        const updatedData = {
            name,
            className,
            subjects: subjects.split(',').map(s => s.trim()),
            experience,
            address,
            qualification
        };

        try {
            await updateDoc(userRef, updatedData);
            toast({ title: 'Profile Updated', description: 'Your information has been successfully saved.' });
            setEditOpen(false);
        } catch (e) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update profile.' });
        }
    };
    
    const isProfileIncomplete = useMemo(() => {
        if (!teacherProfile) return true;
        return !teacherProfile.experience || !teacherProfile.address || !teacherProfile.qualification || !teacherProfile.subjects?.length;
    }, [teacherProfile]);

    const isLoading = isUserLoading || isLoadingProfile;

    if (isLoading || !teacherProfile) {
        return (
            <div className="space-y-6">
                 <Skeleton className="h-9 w-64" />
                 <Skeleton className="h-5 w-80 mt-2" />
                 <Card>
                    <CardHeader className="flex flex-col items-center text-center p-6 bg-muted/20">
                        <Skeleton className="h-24 w-24 rounded-full" />
                        <Skeleton className="h-8 w-48 mt-4" />
                        <Skeleton className="h-5 w-32 mt-2" />
                    </CardHeader>
                    <CardContent className="p-6 grid gap-4 md:grid-cols-2">
                        <div className="space-y-4">
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-6 w-5/6" />
                        </div>
                        <div className="space-y-4">
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-6 w-5/6" />
                        </div>
                    </CardContent>
                 </Card>
            </div>
        )
    }

  return (
    <div className="space-y-6">
        <div className="flex items-start justify-between">
            <div>
                <h1 className="text-3xl font-bold font-headline">My Profile</h1>
                <p className="text-muted-foreground">View and manage your personal and professional details.</p>
            </div>
             <Dialog open={isEditOpen} onOpenChange={setEditOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline"><Edit className="mr-2 h-4 w-4" /> Edit Profile</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Your Profile</DialogTitle>
                        <DialogDescription>Update your details below. Click save when you're done.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="className">Coaching Name</Label>
                            <Input id="className" value={className} onChange={(e) => setClassName(e.target.value)} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="subjects">Subjects</Label>
                            <Input id="subjects" value={subjects} onChange={(e) => setSubjects(e.target.value)} placeholder="e.g. Physics, Chemistry" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="qualification">Qualification</Label>
                            <Input id="qualification" value={qualification} onChange={(e) => setQualification(e.target.value)} placeholder="e.g. B.Sc. Physics" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="experience">Experience</Label>
                            <Input id="experience" value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="e.g. 5 Years" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Your coaching or home address" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleProfileUpdate}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
      
        {isProfileIncomplete && (
            <Card className="bg-primary/10 border-primary/20">
                <CardHeader className="flex-row items-center gap-4">
                    <Info className="h-6 w-6 text-primary"/>
                    <div>
                        <CardTitle className="text-lg">Welcome to EduConnect Pro!</CardTitle>
                        <CardDescription className="text-primary/80">Complete your profile to help students and parents learn more about you.</CardDescription>
                    </div>
                </CardHeader>
                <CardFooter>
                     <Button onClick={() => setEditOpen(true)}>Complete Profile Now</Button>
                </CardFooter>
            </Card>
        )}

        <Card className="shadow-lg">
            <CardHeader className="flex flex-col items-center text-center p-6 bg-muted/20">
                <Avatar className="h-24 w-24 mb-4 border-4 border-background">
                    <AvatarImage src={teacherProfile?.avatarUrl} alt={teacherProfile?.name} />
                    <AvatarFallback className="text-3xl">{teacherProfile?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <CardTitle className="text-3xl font-headline">{teacherProfile?.name}</CardTitle>
                <CardDescription className="text-base">{teacherProfile?.className}</CardDescription>
                <div className="flex gap-2 mt-2">
                    {teacherProfile?.subjects?.map(sub => <Badge key={sub} variant="secondary">{sub.trim()}</Badge>)}
                </div>
            </CardHeader>
            <CardContent className="p-6 grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-primary">Professional Details</h3>
                     <div className="flex items-start gap-3">
                        <UserIcon className="h-5 w-5 text-muted-foreground mt-1" />
                        <span>Qualification: <span className="font-medium">{teacherProfile?.qualification || 'N/A'}</span></span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Briefcase className="h-5 w-5 text-muted-foreground" />
                        <span>Experience: <span className="font-medium">{teacherProfile?.experience || 'N/A'}</span></span>
                    </div>
                    <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-muted-foreground mt-1" />
                        <span>Address: <span className="font-medium">{teacherProfile?.address || 'N/A'}</span></span>
                    </div>
                     <div className="flex items-center gap-3">
                        <Book className="h-5 w-5 text-muted-foreground" />
                        <span>Verification Code: <Badge variant="default">{teacherProfile?.id}</Badge></span>
                    </div>
                </div>
                 <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-primary">Contact Information</h3>
                     <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <span>Email: <span className="font-medium">{teacherProfile?.email}</span></span>
                    </div>
                     <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-muted-foreground" />
                        <span>Mobile: <span className="font-medium">{teacherProfile?.mobileNumber}</span></span>
                    </div>
                 </div>
            </CardContent>
        </Card>
    </div>
  );
}
```
- src/app/dashboard/teacher/schedule/page.tsx:
```tsx
'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { PlusCircle, CalendarDays, Video, MapPin, MoreVertical, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, orderBy, doc, updateDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';


type ScheduleItem = {
    id: string;
    topic: string;
    subject: string;
    date: Timestamp;
    time: string;
    type: 'Online' | 'Offline';
    locationOrLink: string;
    status: 'Scheduled' | 'Canceled';
    teacherId: string;
    createdAt: Timestamp;
};

type UserProfile = {
    subjects?: string[];
}

export default function SchedulePage() {
    const { toast } = useToast();
    const [isAddClassOpen, setAddClassOpen] = useState(false);
    
    const { user } = useUser();
    const firestore = useFirestore();
    
    // Form state
    const [topic, setTopic] = useState('');
    const [subject, setSubject] = useState('');
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [time, setTime] = useState('');
    const [classType, setClassType] = useState<'Online' | 'Offline' | ''>('');
    const [locationOrLink, setLocationOrLink] = useState('');

    const userProfileQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);
    const { data: userProfile } = useDoc<UserProfile>(userProfileQuery);
    const teacherSubjects = useMemo(() => userProfile?.subjects || [], [userProfile]);

    const scheduleQuery = useMemoFirebase(() => {
      if (!firestore || !user) return null;
      return query(collection(firestore, 'classSchedules'), where('teacherId', '==', user.uid), orderBy('date', 'desc'));
    }, [firestore, user]);

    const { data: schedule, isLoading } = useCollection<ScheduleItem>(scheduleQuery);
    
    const sortedSchedule = useMemo(() => {
        return schedule?.sort((a,b) => a.date.toMillis() - b.date.toMillis());
    }, [schedule]);


    const handleAddClass = async () => {
        if (!topic || !subject || !date || !time || !classType || !firestore || !user) {
            toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill out all class details.' });
            return;
        }

        const newClass = {
            topic,
            subject,
            date: Timestamp.fromDate(date),
            time,
            type: classType,
            locationOrLink,
            status: 'Scheduled',
            teacherId: user.uid,
            createdAt: serverTimestamp(),
        };

        const scheduleCollection = collection(firestore, 'classSchedules');
        addDocumentNonBlocking(scheduleCollection, newClass);
        
        toast({ title: 'Class Scheduled', description: `${topic} on ${format(date, "PPP")} has been added to your schedule.`});
        
        setTopic('');
        setSubject('');
        setDate(new Date());
        setTime('');
        setClassType('');
        setLocationOrLink('');
        setAddClassOpen(false);
    }

    const handleCancelClass = async (itemId: string) => {
        if (!firestore) return;
        const classRef = doc(firestore, 'classSchedules', itemId);
        await updateDoc(classRef, { status: 'Canceled' });
        toast({ title: 'Class Canceled', description: 'The class has been marked as canceled.'});
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
                        <CalendarDays className="h-8 w-8"/>
                        Class Schedule
                    </h1>
                    <p className="text-muted-foreground">Manage your upcoming classes and events.</p>
                </div>
                 <Dialog open={isAddClassOpen} onOpenChange={setAddClassOpen}>
                    <DialogTrigger asChild>
                        <Button><PlusCircle className="mr-2 h-4 w-4"/> Add Class</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[480px]">
                        <DialogHeader>
                            <DialogTitle>Schedule a New Class</DialogTitle>
                            <DialogDescription>Fill in the details for your new class session.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="topic" className="text-right">Topic*</Label>
                                <Input id="topic" value={topic} onChange={e => setTopic(e.target.value)} className="col-span-3" placeholder="e.g., Quantum Physics" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="subject" className="text-right">Subject*</Label>
                                <Select onValueChange={setSubject} value={subject}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select a subject" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {teacherSubjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="date" className="text-right">Date*</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn("col-span-3 justify-start text-left font-normal", !date && "text-muted-foreground")}
                                        >
                                            <CalendarDays className="mr-2 h-4 w-4" />
                                            {date ? format(date, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                                    </PopoverContent>
                                </Popover>
                             </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="time" className="text-right">Time*</Label>
                                <Input id="time" type="time" value={time} onChange={e => setTime(e.target.value)} className="col-span-3" />
                            </div>
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="type" className="text-right">Type*</Label>
                                <Select onValueChange={(v) => setClassType(v as any)} value={classType}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select class type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Online">Online</SelectItem>
                                        <SelectItem value="Offline">Offline</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="location" className="text-right">{classType === 'Online' ? 'Meet Link' : 'Location'}</Label>
                                <Input id="location" value={locationOrLink} onChange={e => setLocationOrLink(e.target.value)} className="col-span-3" placeholder={classType === 'Online' ? 'https://meet.google.com/...' : 'e.g. Classroom #5'} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleAddClass}>Schedule Class</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Upcoming Classes</CardTitle>
                    <CardDescription>Here is your schedule for the upcoming days.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     {isLoading && (
                        <div className="space-y-4">
                           <Skeleton className="h-16 w-full" />
                           <Skeleton className="h-16 w-full" />
                           <Skeleton className="h-16 w-full" />
                        </div>
                     )}
                     {sortedSchedule && sortedSchedule.length > 0 ? (
                        sortedSchedule.map(item => (
                            <div key={item.id} className={cn("flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50", item.status === 'Canceled' && 'bg-muted/50 opacity-60')}>
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-center justify-center p-3 text-sm font-semibold text-center rounded-md w-20 bg-primary/10 text-primary">
                                        <span>{item.date.toDate().toLocaleDateString('en-US', { day: '2-digit' })}</span>
                                        <span>{item.date.toDate().toLocaleDateString('en-US', { month: 'short' })}</span>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-lg">{item.topic}</h3>
                                            {item.status === 'Canceled' && <Badge variant="destructive">Canceled</Badge>}
                                        </div>
                                        <p className="text-sm text-muted-foreground">{item.subject} • {item.time}</p>
                                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                            {item.type === 'Online' ? <Video className="h-4 w-4"/> : <MapPin className="h-4 w-4"/>}
                                            {item.locationOrLink || 'Not specified'}
                                        </p>
                                    </div>
                                </div>
                                {item.status === 'Scheduled' && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon"><MoreVertical className="h-5 w-5"/></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem onClick={() => handleCancelClass(item.id)} className="text-red-600 focus:text-red-600 focus:bg-red-100">
                                                <XCircle className="mr-2 h-4 w-4"/>
                                                Cancel Class
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
                        ))
                     ) : !isLoading && (
                        <p className="text-sm text-center text-muted-foreground py-8">You haven't scheduled any classes yet.</p>
                     )}
                </CardContent>
            </Card>

        </div>
    );
}
```
- src/app/dashboard/teacher/student/[studentId]/page.tsx:
```tsx
'use client';

import { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, XCircle, Mail, Phone, ArrowLeft, BarChart3, CalendarCheck } from 'lucide-react';
import { notFound, useParams } from 'next/navigation';
import { useFirestore, useDoc, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { doc, collection, query, where, orderBy } from 'firebase/firestore';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PerformanceChart } from '@/components/performance-chart';

type StudentProfile = {
  id: string;
  name: string;
  email: string;
  mobileNumber?: string;
  avatarUrl?: string;
};

type PerformanceItem = {
    id: string;
    testName: string;
    marks: number;
    maxMarks: number;
    date: { toDate: () => Date };
};

type AttendanceItem = {
    id: string;
    date: { toDate: () => Date };
    isPresent: boolean;
};

export default function StudentProfilePage() {
  const params = useParams();
  const studentId = params.studentId as string;
  const firestore = useFirestore();
  const { user: teacherUser } = useUser();

  const studentQuery = useMemoFirebase(() => {
    if (!firestore || !studentId) return null;
    return doc(firestore, 'users', studentId);
  }, [firestore, studentId]);
  const { data: student, isLoading: isLoadingStudent } = useDoc<StudentProfile>(studentQuery);

  const isLoading = isLoadingStudent;

  if (isLoading) {
    return <div className="space-y-6">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-[300px] w-full" />
    </div>;
  }

  if (!student) {
    notFound();
  }

  return (
    <div className="space-y-6">
        <Button variant="ghost" asChild className="mb-4">
            <Link href="/dashboard/teacher">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to My Students
            </Link>
        </Button>
       <Card className="shadow-lg">
            <CardHeader className="flex flex-col items-center text-center p-6 bg-muted/20">
                <Avatar className="h-24 w-24 mb-4 border-4 border-background">
                    <AvatarImage src={student?.avatarUrl} alt={student?.name} />
                    <AvatarFallback className="text-3xl">{student?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <CardTitle className="text-4xl font-headline">{student?.name}</CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-primary">Contact Information</h3>
                     <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <span>Email: <span className="font-medium">{student?.email}</span></span>
                    </div>
                     <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-muted-foreground" />
                        <span>Mobile: <span className="font-medium">{student?.mobileNumber || 'Not provided'}</span></span>
                    </div>
                 </div>
            </CardContent>
        </Card>
    </div>
  );
}
```
- src/app/global-error.tsx:
```tsx
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Card className="w-full max-w-lg text-center shadow-2xl">
                <CardHeader>
                    <CardTitle className="text-2xl font-headline text-destructive">Something went wrong!</CardTitle>
                    <CardDescription>
                        We encountered an unexpected error. Please try again.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {process.env.NODE_ENV === 'development' && (
                        <div className="p-4 text-left bg-muted rounded-md text-xs overflow-auto">
                            <h3 className="font-semibold mb-2">Error Details:</h3>
                            <pre className="whitespace-pre-wrap">
                                <code>{error.stack || error.message}</code>
                            </pre>
                        </div>
                    )}
                    <Button onClick={reset}>
                        Try again
                    </Button>
                </CardContent>
            </Card>
        </div>
      </body>
    </html>
  );
}
```
- src/app/globals.css:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 220 20% 96%; /* #EEF0F2 */
    --foreground: 220 10% 15%;
    --card: 220 20% 100%;
    --card-foreground: 220 10% 15%;
    --popover: 220 20% 100%;
    --popover-foreground: 220 10% 15%;
    --primary: 210 80% 50%; /* A modern, friendly blue */
    --primary-foreground: 0 0% 100%;
    --secondary: 220 10% 90%;
    --secondary-foreground: 220 10% 25%;
    --muted: 220 10% 85%;
    --muted-foreground: 220 5% 45%;
    --accent: 180 80% 40%; /* A vibrant teal for highlights */
    --accent-foreground: 0 0% 100%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 220 15% 88%;
    --input: 220 15% 92%;
    --ring: 210 80% 50%;
    --radius: 0.75rem;
  }
 
  .dark {
    --background: 220 15% 10%;
    --foreground: 220 10% 90%;
    --card: 220 15% 15%;
    --card-foreground: 220 10% 90%;
    --popover: 220 15% 10%;
    --popover-foreground: 220 10% 90%;
    --primary: 210 80% 55%;
    --primary-foreground: 220 10% 5%;
    --secondary: 220 10% 25%;
    --secondary-foreground: 220 10% 90%;
    --muted: 220 10% 20%;
    --muted-foreground: 220 5% 60%;
    --accent: 180 80% 45%;
    --accent-foreground: 220 10% 5%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 220 15% 20%;
    --input: 220 15% 25%;
    --ring: 210 80% 55%;
  }
}
 
@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
}

@layer utilities {
  .bg-grid-pattern {
    background-image:
      linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
      linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px);
    background-size: 2rem 2rem;
  }
}
```
- src/app/layout.tsx:
```tsx
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { cn } from '@/lib/utils';
import { FirebaseClientProvider } from '@/firebase/client-provider';

export const metadata: Metadata = {
  title: 'EduConnect Pro',
  description: 'A modern educational platform for teachers, students, and parents.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet" />
      </head>
      <body className={cn("font-body antialiased min-h-screen")}>
        <FirebaseClientProvider>
          {children}
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
```
- src/app/login/page.tsx:
```tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Mail, Key, LogIn } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { initiateEmailSignIn, useAuth, initiateGoogleSignIn, useFirestore } from '@/firebase'; // Using the non-blocking sign-in
import { getAdditionalUserInfo, UserCredential } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.022,35.321,44,30.038,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
);


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setGoogleLoading] = useState(false);
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!auth) {
        throw new Error("Auth service is not available.");
      }
      await initiateEmailSignIn(auth, email, password);
      toast({ title: 'Login Successful', description: "You're being redirected to your dashboard." });
      
      router.push('/dashboard/teacher');
    } catch (error: any) {
      console.error(error);
      let description = "An unexpected error occurred. Please try again."
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        description = "Invalid email or password. Please check your credentials and try again.";
      }
      toast({ variant: 'destructive', title: 'Login Failed', description: description });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewGoogleUser = async (userCredential: UserCredential) => {
    const user = userCredential.user;
    if (!firestore) {
        toast({ variant: 'destructive', title: 'Error', description: 'Database service is not available.' });
        return;
    };
    
    // Create user profile document in Firestore
    const userRef = doc(firestore, 'users', user.uid);
    await setDoc(userRef, {
        id: user.uid,
        name: user.displayName,
        email: user.email,
        mobileNumber: user.phoneNumber,
        role: 'tutor',
        status: 'pending_verification' // New users start as pending
    });
    
    // Create teacher-specific document
    const teacherRef = doc(firestore, 'teachers', user.uid);
    await setDoc(teacherRef, {
        userId: user.uid,
        verificationCode: user.uid,
    });
    
    toast({ title: 'Welcome!', description: 'Please complete your profile to get started.' });
    router.push('/dashboard/teacher/profile');
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
        if (!auth) throw new Error("Auth service not available.");

        const userCredential = await initiateGoogleSignIn(auth);
        const additionalInfo = getAdditionalUserInfo(userCredential);

        if (additionalInfo?.isNewUser) {
            await handleNewGoogleUser(userCredential);
        } else {
            toast({ title: 'Login Successful', description: "Welcome back!" });
            router.push('/dashboard/teacher');
        }
    } catch (error: any) {
        console.error("Google Sign In Error:", error);
        toast({ variant: 'destructive', title: 'Google Sign-In Failed', description: error.message || 'An unexpected error occurred.' });
    } finally {
        setGoogleLoading(false);
    }
  };


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-grid-pattern p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <form onSubmit={handleLogin}>
          <CardHeader>
            <CardTitle className="text-center text-2xl font-headline">Tutor Login</CardTitle>
            <CardDescription className="text-center">Enter your credentials to access your dashboard.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required className="pl-10"/>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
               <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required className="pl-10"/>
              </div>
               <div className="text-right">
                <Link href="#" className="text-sm text-primary hover:underline">
                    Forgot Password?
                </Link>
            </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
              <LogIn className="mr-2 h-4 w-4"/>
              {isLoading ? 'Logging In...' : 'Login'}
            </Button>
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading || isGoogleLoading}>
              {isGoogleLoading ? 'Signing in...' : <><GoogleIcon className="mr-2"/> Sign in with Google</>}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Don't have an account? <Link href="/signup" className="text-primary hover:underline">Become a Tutor</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
```
- src/app/page.tsx:
```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { User, Shield, GraduationCap } from 'lucide-react';

export default function RoleSelectionPage() {
  const [selectedRole, setSelectedRole] = useState<string>('student');
  const router = useRouter();

  const handleContinue = () => {
    if (selectedRole === 'tutor') {
      router.push('/login');
    } else if (selectedRole === 'student') {
        router.push('/dashboard/student');
    }
     else if (selectedRole === 'parent') {
        router.push('/dashboard/parent');
    }
     else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-grid-pattern">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Choose Your Role</CardTitle>
          <CardDescription>Select your role to get started with EduConnect Pro.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup value={selectedRole} onValueChange={setSelectedRole} className="grid grid-cols-1 gap-4">
            <Label htmlFor="student" className="flex items-center gap-4 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
              <RadioGroupItem value="student" id="student" className="sr-only" />
              <User className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-semibold">Student</h3>
                <p className="text-sm text-muted-foreground">Access materials and track progress.</p>
              </div>
            </Label>
             <Label htmlFor="parent" className="flex items-center gap-4 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
              <RadioGroupItem value="parent" id="parent" className="sr-only" />
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-semibold">Parent</h3>
                <p className="text-sm text-muted-foreground">Monitor your child's journey.</p>
              </div>
            </Label>
             <Label htmlFor="tutor" className="flex items-center gap-4 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
              <RadioGroupItem value="tutor" id="tutor" className="sr-only" />
              <GraduationCap className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-semibold">Tutor</h3>
                <p className="text-sm text-muted-foreground">Login to your dashboard.</p>
              </div>
            </Label>
          </RadioGroup>
          <Button onClick={handleContinue} className="w-full">
            Continue as {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```
- src/app/signup/page.tsx:
```tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Check, User, Briefcase, BookCopy } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAuth, initiateEmailSignUp, useFirestore } from '@/firebase';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const steps = [
    { id: 1, name: 'Basic Details', icon: User },
    { id: 2, name: 'Subjects', icon: BookCopy },
    { id: 3, name: 'Experience', icon: Briefcase },
    { id: 4, name: 'Verification', icon: Check },
];

const subjectCategories = ["Maths", "Physics", "Chemistry", "Biology", "English", "Computer", "Competitive Exam"];
const classLevels = ["Class 6–8", "Class 9–10", "Class 11–12", "Diploma / Degree"];
const experienceLevels = ["Fresher", "1–2 years", "3+ years"];
const experienceTypes = ["School", "Coaching", "Home Tutor", "Online"];


export default function SignUpPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobileNumber: '',
    password: '',
    confirmPassword: '',
    subjectCategory: '',
    subjects: [] as string[],
    classLevels: [] as string[],
    qualification: '',
    experience: '',
    experienceType: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();

  const handleSubjectChange = (subject: string) => {
    setFormData(prev => {
        const newSubjects = prev.subjects.includes(subject)
            ? prev.subjects.filter(s => s !== subject)
            : [...prev.subjects, subject];
        return { ...prev, subjects: newSubjects };
    });
  };

  const handleClassLevelChange = (level: string) => {
    setFormData(prev => {
        const newLevels = prev.classLevels.includes(level)
            ? prev.classLevels.filter(l => l !== level)
            : [...prev.classLevels, level];
        return { ...prev, classLevels: newLevels };
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };
  
  const handleSelectChange = (id: keyof typeof formData, value: string) => {
    setFormData(prev => ({...prev, [id]: value}))
  }

  const handleNext = () => {
    if (currentStep === 1) {
        if (!formData.name || !formData.email || !formData.mobileNumber || !formData.password || !formData.confirmPassword) {
            toast({ variant: 'destructive', title: 'Missing Fields', description: 'Please fill all the basic details.'});
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            toast({ variant: 'destructive', title: 'Passwords Do Not Match', description: 'Please ensure your passwords match.'});
            return;
        }
    }
    setCurrentStep(prev => Math.min(prev + 1, steps.length));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };
  
  const handleRegistration = async () => {
    if (!firestore || !auth) {
        toast({ variant: 'destructive', title: 'Error', description: 'Database service not available. Please try again later.' });
        return;
    }
    setIsLoading(true);
    try {
        const userCredential = await initiateEmailSignUp(auth, formData.email, formData.password);
        const user = userCredential.user;

        await updateProfile(user, { displayName: formData.name });

        const userRef = doc(firestore, 'users', user.uid);
        await setDoc(userRef, {
            id: user.uid,
            name: formData.name,
            email: formData.email,
            mobileNumber: formData.mobileNumber,
            role: 'tutor',
            subjects: formData.subjects,
            classLevels: formData.classLevels,
            subjectCategory: formData.subjectCategory,
            qualification: formData.qualification,
            experience: formData.experience,
            experienceType: formData.experienceType,
            status: 'pending_verification'
        });

        const teacherRef = doc(firestore, 'teachers', user.uid);
        await setDoc(teacherRef, {
          userId: user.uid,
          verificationCode: user.uid, 
        });
        
        toast({ title: 'Registration Submitted!', description: 'Your profile is now pending verification.' });
        router.push('/dashboard/teacher');
    } catch (error: any) {
        let description = 'An unexpected error occurred. Please try again.';
        if (error.code === 'auth/email-already-in-use') {
            description = 'This email address is already registered. Please log in or use a different email.';
        }
        toast({ variant: 'destructive', title: 'Registration Failed', description });
    } finally {
        setIsLoading(false);
    }
  };

  const progressValue = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-grid-pattern p-4">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-headline">Become a Tutor</CardTitle>
          <CardDescription className="text-center">Follow the steps below to create your tutor profile.</CardDescription>
          <div className="pt-4">
              <Progress value={progressValue} className="w-full" />
              <div className={`grid grid-cols-${steps.length} mt-2`}>
                  {steps.map(step => (
                      <div key={step.id} className="text-center">
                          <p className={`text-xs sm:text-sm font-medium ${currentStep >= step.id ? 'text-primary' : 'text-muted-foreground'}`}>{step.name}</p>
                      </div>
                  ))}
              </div>
          </div>
        </CardHeader>
        <CardContent className="min-h-[350px]">
            {currentStep === 1 && (
                <div className="space-y-4 animate-in fade-in-50">
                    <h3 className="font-semibold text-lg flex items-center gap-2"><User className="h-5 w-5 text-primary" /> Basic Details</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input id="name" value={formData.name} onChange={handleChange} placeholder="John Doe" />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="mobileNumber">Mobile Number</Label>
                          <Input id="mobileNumber" type="tel" value={formData.mobileNumber} onChange={handleChange} placeholder="9876543210" />
                          {/* OTP verification would go here */}
                      </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" type="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" />
                    </div>
                     <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" type="password" value={formData.password} onChange={handleChange} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} />
                        </div>
                    </div>
                </div>
            )}
             {currentStep === 2 && (
                <div className="space-y-4 animate-in fade-in-50">
                    <h3 className="font-semibold text-lg flex items-center gap-2"><BookCopy className="h-5 w-5 text-primary" /> Subject Selection</h3>
                     <div className="space-y-2">
                        <Label>Subject Category</Label>
                         <Select onValueChange={(value) => handleSelectChange('subjectCategory', value)} value={formData.subjectCategory}>
                            <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                            <SelectContent>
                                {subjectCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Class / Level</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {classLevels.map(level => (
                                <div key={level} className="flex items-center space-x-2">
                                    <Checkbox id={level} checked={formData.classLevels.includes(level)} onCheckedChange={() => handleClassLevelChange(level)} />
                                    <Label htmlFor={level} className="text-sm font-normal">{level}</Label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            {currentStep === 3 && (
                <div className="space-y-4 animate-in fade-in-50">
                    <h3 className="font-semibold text-lg flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary" /> Qualification & Experience</h3>
                     <div className="space-y-2">
                        <Label htmlFor="qualification">Highest Qualification</Label>
                        <Input id="qualification" value={formData.qualification} onChange={handleChange} placeholder="e.g., B.Tech in Computer Science" />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                          <Label>Teaching Experience</Label>
                          <Select onValueChange={(value) => handleSelectChange('experience', value)} value={formData.experience}>
                              <SelectTrigger><SelectValue placeholder="Select experience level" /></SelectTrigger>
                              <SelectContent>
                                  {experienceLevels.map(exp => <SelectItem key={exp} value={exp}>{exp}</SelectItem>)}
                              </SelectContent>
                          </Select>
                      </div>
                       <div className="space-y-2">
                          <Label>Primary Experience Type</Label>
                          <Select onValueChange={(value) => handleSelectChange('experienceType', value)} value={formData.experienceType}>
                              <SelectTrigger><SelectValue placeholder="Select experience type" /></SelectTrigger>
                              <SelectContent>
                                  {experienceTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                              </SelectContent>
                          </Select>
                      </div>
                    </div>
                </div>
            )}
             {currentStep === 4 && (
                <div className="text-center space-y-4 flex flex-col items-center animate-in fade-in-50">
                    <Check className="h-12 w-12 text-green-500 bg-green-100 rounded-full p-2" />
                    <h3 className="font-semibold text-xl">Review & Submit</h3>
                    <p className="text-muted-foreground max-w-md">
                        Please review your details. You can go back to change any information.
                    </p>
                    <Card className="text-left w-full p-4 bg-muted/50">
                        <p><strong>Name:</strong> {formData.name}</p>
                        <p><strong>Email:</strong> {formData.email}</p>
                        <p><strong>Mobile:</strong> {formData.mobileNumber}</p>
                        <p><strong>Subjects:</strong> {formData.subjectCategory}</p>
                         <p><strong>Classes:</strong> {formData.classLevels.join(', ')}</p>
                        <p><strong>Qualification:</strong> {formData.qualification}</p>
                        <p><strong>Experience:</strong> {formData.experience} ({formData.experienceType})</p>
                    </Card>
                    <Button size="lg" className="w-full max-w-xs" onClick={handleRegistration} disabled={isLoading}>
                        {isLoading ? 'Submitting...' : 'Agree & Submit for Verification'}
                    </Button>
                </div>
            )}
        </CardContent>
        <CardFooter className="flex justify-between">
            {currentStep > 1 ? (
                <Button variant="outline" onClick={handleBack}>Back</Button>
            ) : <div />}
            {currentStep < steps.length ? (
                <Button onClick={handleNext}>Next</Button>
            ) : <div></div>}
        </CardFooter>
      </Card>
      <p className="text-center text-sm text-muted-foreground mt-4">
        Already have an account? <Link href="/login" className="text-primary hover:underline">Log in</Link>
      </p>
    </div>
  );
}
```
- src/app/signup-student/page.tsx:
```tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Check, User, Mail, Key } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAuth, initiateEmailSignUp, useFirestore } from '@/firebase';
import { setDoc, doc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';

const steps = [
    { id: 1, name: 'Account Details', fields: ['name', 'email', 'password'], icon: User },
    { id: 2, name: 'Verification', icon: Check },
];

export default function SignUpStudentPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleNext = () => {
    if (currentStep === 1) {
        if (!formData.name || !formData.email || !formData.password) {
            toast({
                variant: 'destructive',
                title: 'Missing Information',
                description: 'Please fill out all account details.',
            });
            return;
        }
    }
    setCurrentStep(prev => Math.min(prev + 1, steps.length));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };
  
  const handleRegistration = async () => {
    if (!firestore || !auth) return;
    setIsLoading(true);
    try {
        const userCredential = await initiateEmailSignUp(auth, formData.email, formData.password);
        const user = userCredential.user;

        await updateProfile(user, { displayName: formData.name });

        // Create user profile document in Firestore
        const userRef = doc(firestore, 'users', user.uid);
        await setDoc(userRef, {
            id: user.uid,
            name: formData.name,
            email: formData.email,
            role: 'student',
        });
        
        toast({ title: 'Registration Successful!', description: 'Your account is being created. Redirecting to your dashboard...' });
        
        router.push('/dashboard/student');
    } catch (error: any) {
        let description = 'An unexpected error occurred. Please try again.';
        if (error.code === 'auth/email-already-in-use') {
            description = 'This email address is already registered. Please log in or use a different email.';
        }
        toast({ variant: 'destructive', title: 'Registration Failed', description });
        setIsLoading(false);
    }
  };


  const progressValue = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-grid-pattern p-4">
      <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-headline">Create Your Student Account</CardTitle>
          <CardDescription className="text-center">Join EduConnect Pro to access your learning materials.</CardDescription>
          <div className="pt-4">
              <Progress value={progressValue} className="w-full" />
              <div className="grid grid-cols-2 mt-2">
                  {steps.map(step => (
                      <div key={step.id} className="text-center">
                          <p className={`text-sm font-medium ${currentStep >= step.id ? 'text-primary' : 'text-muted-foreground'}`}>{step.name}</p>
                      </div>
                  ))}
              </div>
          </div>
        </CardHeader>
        <CardContent className="min-h-[250px]">
            {currentStep === 1 && (
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2"><User className="h-5 w-5 text-primary" /> Account Details</h3>
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" value={formData.name} onChange={handleChange} placeholder="Jane Doe" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" type="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input id="password" type="password" value={formData.password} onChange={handleChange} required />
                    </div>
                </div>
            )}
             {currentStep === 2 && (
                <div className="text-center space-y-4 flex flex-col items-center pt-8">
                    <Check className="h-12 w-12 text-green-500 bg-green-100 rounded-full p-2" />
                    <h3 className="font-semibold text-xl">Review and Complete</h3>
                    <p className="text-muted-foreground max-w-md">
                        You're ready to go! Click the button below to create your student account.
                    </p>
                    <Button size="lg" className="w-full max-w-xs" onClick={handleRegistration} disabled={isLoading}>
                         <Mail className="mr-2 h-5 w-5" /> {isLoading ? 'Creating Account...' : 'Complete Registration'}
                    </Button>
                </div>
            )}
        </CardContent>
        <CardFooter className="flex justify-between">
            {currentStep === 2 ? (
                <Button variant="outline" onClick={handleBack}>Back</Button>
            ) : <div />}
            {currentStep === 1 ? (
                <Button onClick={handleNext}>Next</Button>
            ) : <div></div>}
        </CardFooter>
      </Card>
      <p className="text-center text-sm text-muted-foreground mt-4">
        Already have an account? <Link href="/login" className="text-primary hover:underline">Log in</Link>
      </p>
    </div>
  );
}
```
- src/components/FirebaseErrorListener.tsx:
```tsx
'use client';

import { useState, useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * An invisible component that listens for globally emitted 'permission-error' events.
 * It throws any received error to be caught by Next.js's global-error.tsx.
 */
export function FirebaseErrorListener() {
  // Use the specific error type for the state for type safety.
  const [error, setError] = useState<FirestorePermissionError | null>(null);

  useEffect(() => {
    // The callback now expects a strongly-typed error, matching the event payload.
    const handleError = (error: FirestorePermissionError) => {
      // Set error in state to trigger a re-render.
      setError(error);
    };

    // The typed emitter will enforce that the callback for 'permission-error'
    // matches the expected payload type (FirestorePermissionError).
    errorEmitter.on('permission-error', handleError);

    // Unsubscribe on unmount to prevent memory leaks.
    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  // On re-render, if an error exists in state, throw it.
  if (error) {
    throw error;
  }

  // This component renders nothing.
  return null;
}
```
- src/components/connect-teacher-form.tsx:
```tsx
'use client';

import { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { useToast } from '@/hooks/use-toast';
import { Link as LinkIcon } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, getDocs, doc } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

type ConnectTeacherFormProps = {
    onConnectionSuccess: () => void;
};

type TeacherUser = {
    id: string;
    name: string;
    role: string;
}

export function ConnectTeacherForm({ onConnectionSuccess }: ConnectTeacherFormProps) {
    const [teacherCode, setTeacherCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const { user } = useUser();
    const firestore = useFirestore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!teacherCode) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Please enter your teacher\'s verification code.',
            });
            return;
        }

        if (!user) {
            toast({
                variant: 'destructive',
                title: 'Not Logged In',
                description: 'You must be logged in to connect with a teacher.',
            });
            return;
        }

        if (!firestore) return;

        setIsLoading(true);

        try {
            // The teacher's verification code is their user ID.
            const usersRef = collection(firestore, 'users');
            const q = query(usersRef, where('id', '==', teacherCode), where('role', '==', 'tutor'));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                toast({
                    variant: 'destructive',
                    title: 'Invalid Code',
                    description: 'No teacher found with that verification code. Please try again.',
                });
                setIsLoading(false);
                return;
            }
            
            const teacherDoc = querySnapshot.docs[0];
            const teacherData = teacherDoc.data() as TeacherUser;
            const teacherId = teacherData.id;
            
            const enrollmentsRef = collection(firestore, 'enrollments');
            const existingEnrollmentQuery = query(enrollmentsRef, where('studentId', '==', user.uid), where('teacherId', '==', teacherId));
            const existingEnrollmentSnapshot = await getDocs(existingEnrollmentQuery);

            if (!existingEnrollmentSnapshot.empty) {
                toast({
                    variant: 'default',
                    title: 'Already Connected',
                    description: 'You already have a pending or approved connection with this teacher.',
                });
                setIsLoading(false);
                return;
            }

            const enrollmentData = {
                studentId: user.uid,
                studentName: user.displayName || 'New Student',
                studentAvatar: user.photoURL || `https://picsum.photos/seed/${user.uid}/40/40`,
                teacherId: teacherId,
                teacherName: teacherData.name || 'Teacher',
                status: 'pending'
            };
            
            addDocumentNonBlocking(collection(firestore, "enrollments"), enrollmentData);

            toast({
                title: 'Request Sent!',
                description: `Your connection request has been sent to ${teacherData.name}.`,
            });
            onConnectionSuccess();
            setTeacherCode('');

        } catch (error) {
            console.error("Error connecting with teacher:", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not send connection request. Please try again later.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-grow">
                     <Label htmlFor="teacher-code" className="sr-only">Teacher's Verification Code</Label>
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        id="teacher-code"
                        placeholder="Enter teacher's code"
                        value={teacherCode}
                        onChange={(e) => setTeacherCode(e.target.value)}
                        className="pl-10 text-base"
                        required
                    />
                </div>
                <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
                    {isLoading ? 'Sending Request...' : 'Send Request'}
                </Button>
            </div>
        </form>
    );
}
```
- src/components/dashboard-nav.tsx:
```tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  BookOpenCheck,
  User,
  FileText,
  Users,
  LogOut,
  ClipboardList,
  BarChart3,
  Users2,
  CalendarDays,
  Shield,
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { buttonVariants } from './ui/button';
import { useEffect, useState } from 'react';
import { Skeleton } from './ui/skeleton';
import { useAuth } from '@/firebase';

type Role = 'teacher' | 'student' | 'parent';

const navItems = {
  teacher: [
    { href: '/dashboard/teacher', label: 'Dashboard', icon: Home },
    { href: '/dashboard/teacher/profile', label: 'My Profile', icon: User },
    { href: '/dashboard/teacher/batches', label: 'Batches', icon: Users2 },
    { href: '/dashboard/teacher/materials', label: 'Materials', icon: BookOpenCheck },
    { href: '/dashboard/teacher/schedule', label: 'Schedule', icon: CalendarDays },
    { href: '/dashboard/teacher/attendance', label: 'Attendance', icon: FileText },
    { href: '/dashboard/teacher/performance', label: 'Performance', icon: BarChart3 },
  ],
  student: [
    { href: '/dashboard/student/study-material', label: 'Study Material', icon: BookOpenCheck },
    { href: '/dashboard/student/daily-practice', label: 'Daily Practice', icon: ClipboardList },
  ],
  parent: [], // Parent dashboard has no sidebar navigation
};

const roleIcons = {
  teacher: <User className="h-5 w-5" />,
  student: <BookOpenCheck className="h-5 w-5" />,
  parent: <Shield className="h-5 w-5" />,
};

export function DashboardNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const items = navItems[role] || [];
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLogout = () => {
    if (auth) {
        auth.signOut();
    }
    router.push('/');
  };

  if (role === 'parent') {
    return null; // No navigation for parents in the sidebar
  }


  return (
    <nav className="flex flex-col gap-2 p-4">
       {isClient ? (
        <Collapsible defaultOpen={true} key={role}>
          <CollapsibleTrigger
            className={cn(
              buttonVariants({ variant: 'ghost' }),
              'flex w-full justify-start items-center gap-3 mb-2 font-semibold text-lg hover:bg-primary/10'
            )}
          >
            {roleIcons[role]}
            <span className="capitalize">{role} Menu</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="flex flex-col gap-1 pl-4 border-l-2 border-primary/20 ml-4">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  buttonVariants({ variant: 'ghost' }),
                  'justify-start gap-3',
                  pathname === item.href && 'bg-primary/10 text-primary font-semibold'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </CollapsibleContent>
        </Collapsible>
      ) : (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <div className="pl-4 space-y-1">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
      )}


      <div className="mt-auto flex flex-col gap-1 pt-4 border-t">
        <button
          onClick={handleLogout}
          className={cn(
            buttonVariants({ variant: 'ghost' }),
            'justify-start gap-3 text-red-500 hover:text-red-500 hover:bg-red-500/10'
          )}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </nav>
  );
}
```
- src/components/icons.tsx:
```tsx
import type { LucideProps } from "lucide-react";

export const Icons = {
  logo: (props: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
      <path d="M14 6h2" />
      <path d="M14 10h2" />
      <path d="m9 15-5-5" />
      <path d="m9 10 5 5" />
    </svg>
  ),
};
```
- src/components/landing-header.tsx:
```tsx
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { useUser } from '@/firebase';

export function LandingHeader() {
  const { user, isUserLoading } = useUser();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Icons.logo className="h-6 w-6 text-primary" />
            <span className="font-bold sm:inline-block font-headline text-lg">EduConnect Pro</span>
          </Link>
        </div>
        
        <div className="flex flex-1 items-center justify-end space-x-2">
          {!isUserLoading && (
            <>
              {user ? (
                <Button asChild>
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button variant="ghost" asChild>
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/signup">Become a Tutor</Link>
                  </Button>
                </>
              )}
            </>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
              <div className="flex flex-col h-full">
                <div className="flex items-center mb-8">
                    <Icons.logo className="h-6 w-6 text-primary" />
                    <span className="ml-2 font-bold font-headline text-lg">EduConnect Pro</span>
                </div>
                <nav className="flex flex-col gap-4 text-lg font-medium">
                    {!isUserLoading && !user && (
                      <Link href="/signup" className="text-foreground/60 hover:text-foreground">Become a Tutor</Link>
                    )}
                </nav>
                <div className="mt-auto flex flex-col gap-2">
                    {!isUserLoading && (
                      <>
                        {user ? (
                           <Button asChild>
                              <Link href="/dashboard">Go to Dashboard</Link>
                           </Button>
                        ) : (
                           <Button asChild>
                              <Link href="/login">Login</Link>
                           </Button>
                        )}
                      </>
                    )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
```
- src/components/performance-chart.tsx:
```tsx
"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartTooltipContent, ChartTooltip, ChartContainer } from "@/components/ui/chart"

export function PerformanceChart({ data }: { data: { name: string; score: number }[] }) {
    const chartConfig = {
      score: {
        label: "Score",
        color: "hsl(var(--primary))",
      },
    }
  
    return (
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader>
          <CardTitle>Test Performance</CardTitle>
          <CardDescription>Recent test scores summary.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={{stroke: "hsl(var(--border))"}} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={{stroke: "hsl(var(--border))"}} tickFormatter={(value) => `${value}`} domain={[0, 100]}/>
                    <ChartTooltip 
                      cursor={false} 
                      content={<ChartTooltipContent 
                        indicator="dot"
                        labelClassName="font-bold font-body"
                        className="bg-card shadow-lg rounded-lg" 
                      />} 
                    />
                    <Bar dataKey="score" fill="var(--color-score)" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    )
}
```
- src/components/ui/accordion.tsx:
```tsx
"use client"

import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

const Accordion = AccordionPrimitive.Root

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn("border-b", className)}
    {...props}
  />
))
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
))
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn("pb-4 pt-0", className)}>{children}</div>
  </AccordionPrimitive.Content>
))

AccordionContent.displayName = AccordionPrimitive.Content.displayName

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
```
- src/components/ui/alert-dialog.tsx:
```tsx
"use client"

import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

const AlertDialog = AlertDialogPrimitive.Root

const AlertDialogTrigger = AlertDialogPrimitive.Trigger

const AlertDialogPortal = AlertDialogPrimitive.Portal

const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
))
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName

const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ className, ...props }, ref) => (
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <AlertDialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    />
  </AlertDialogPortal>
))
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName

const AlertDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
AlertDialogHeader.displayName = "AlertDialogHeader"

const AlertDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
AlertDialogFooter.displayName = "AlertDialogFooter"

const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold", className)}
    {...props}
  />
))
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName

const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
AlertDialogDescription.displayName =
  AlertDialogPrimitive.Description.displayName

const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Action
    ref={ref}
    className={cn(buttonVariants(), className)}
    {...props}
  />
))
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName

const AlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel
    ref={ref}
    className={cn(
      buttonVariants({ variant: "outline" }),
      "mt-2 sm:mt-0",
      className
    )}
    {...props}
  />
))
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}
```
- src/components/ui/alert.tsx:
```tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
```
- src/components/ui/avatar.tsx:
```tsx
"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }
```
- src/components/ui/badge.tsx:
```tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
```
- src/components/ui/button.tsx:
```tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```
- src/components/ui/calendar.tsx:
```tsx
"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn("h-4 w-4", className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn("h-4 w-4", className)} {...props} />
        ),
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
```
- src/components/ui/card.tsx:
```tsx
import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
```
- src/components/ui/carousel.tsx:
```tsx
"use client"

import * as React from "react"
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from "embla-carousel-react"
import { ArrowLeft, ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type CarouselApi = UseEmblaCarouselType[1]
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>
type CarouselOptions = UseCarouselParameters[0]
type CarouselPlugin = UseCarouselParameters[1]

type CarouselProps = {
  opts?: CarouselOptions
  plugins?: CarouselPlugin
  orientation?: "horizontal" | "vertical"
  setApi?: (api: CarouselApi) => void
}

type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0]
  api: ReturnType<typeof useEmblaCarousel>[1]
  scrollPrev: () => void
  scrollNext: () => void
  canScrollPrev: boolean
  canScrollNext: boolean
} & CarouselProps

const CarouselContext = React.createContext<CarouselContextProps | null>(null)

function useCarousel() {
  const context = React.useContext(CarouselContext)

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />")
  }

  return context
}

const Carousel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & CarouselProps
>(
  (
    {
      orientation = "horizontal",
      opts,
      setApi,
      plugins,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const [carouselRef, api] = useEmblaCarousel(
      {
        ...opts,
        axis: orientation === "horizontal" ? "x" : "y",
      },
      plugins
    )
    const [canScrollPrev, setCanScrollPrev] = React.useState(false)
    const [canScrollNext, setCanScrollNext] = React.useState(false)

    const onSelect = React.useCallback((api: CarouselApi) => {
      if (!api) {
        return
      }

      setCanScrollPrev(api.canScrollPrev())
      setCanScrollNext(api.canScrollNext())
    }, [])

    const scrollPrev = React.useCallback(() => {
      api?.scrollPrev()
    }, [api])

    const scrollNext = React.useCallback(() => {
      api?.scrollNext()
    }, [api])

    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault()
          scrollPrev()
        } else if (event.key === "ArrowRight") {
          event.preventDefault()
          scrollNext()
        }
      },
      [scrollPrev, scrollNext]
    )

    React.useEffect(() => {
      if (!api || !setApi) {
        return
      }

      setApi(api)
    }, [api, setApi])

    React.useEffect(() => {
      if (!api) {
        return
      }

      onSelect(api)
      api.on("reInit", onSelect)
      api.on("select", onSelect)

      return () => {
        api?.off("select", onSelect)
      }
    }, [api, onSelect])

    return (
      <CarouselContext.Provider
        value={{
          carouselRef,
          api: api,
          opts,
          orientation:
            orientation || (opts?.axis === "y" ? "vertical" : "horizontal"),
          scrollPrev,
          scrollNext,
          canScrollPrev,
          canScrollNext,
        }}
      >
        <div
          ref={ref}
          onKeyDownCapture={handleKeyDown}
          className={cn("relative", className)}
          role="region"
          aria-roledescription="carousel"
          {...props}
        >
          {children}
        </div>
      </CarouselContext.Provider>
    )
  }
)
Carousel.displayName = "Carousel"

const CarouselContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { carouselRef, orientation } = useCarousel()

  return (
    <div ref={carouselRef} className="overflow-hidden">
      <div
        ref={ref}
        className={cn(
          "flex",
          orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col",
          className
        )}
        {...props}
      />
    </div>
  )
})
CarouselContent.displayName = "CarouselContent"

const CarouselItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { orientation } = useCarousel()

  return (
    <div
      ref={ref}
      role="group"
      aria-roledescription="slide"
      className={cn(
        "min-w-0 shrink-0 grow-0 basis-full",
        orientation === "horizontal" ? "pl-4" : "pt-4",
        className
      )}
      {...props}
    />
  )
})
CarouselItem.displayName = "CarouselItem"

const CarouselPrevious = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel()

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn(
        "absolute  h-8 w-8 rounded-full",
        orientation === "horizontal"
          ? "-left-12 top-1/2 -translate-y-1/2"
          : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
        className
      )}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      {...props}
    >
      <ArrowLeft className="h-4 w-4" />
      <span className="sr-only">Previous slide</span>
    </Button>
  )
})
CarouselPrevious.displayName = "CarouselPrevious"

const CarouselNext = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { orientation, scrollNext, canScrollNext } = useCarousel()

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn(
        "absolute h-8 w-8 rounded-full",
        orientation === "horizontal"
          ? "-right-12 top-1/2 -translate-y-1/2"
          : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
        className
      )}
      disabled={!canScrollNext}
      onClick={scrollNext}
      {...props}
    >
      <ArrowRight className="h-4 w-4" />
      <span className="sr-only">Next slide</span>
    </Button>
  )
})
CarouselNext.displayName = "CarouselNext"

export {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
}
```
- src/components/ui/chart.tsx:
```tsx
"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { cn } from "@/lib/utils"

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: "", dark: ".dark" } as const

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
}

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }

  return context
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig
    children: React.ComponentProps<
      typeof RechartsPrimitive.ResponsiveContainer
    >["children"]
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = "Chart"

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([, config]) => config.theme || config.color
  )

  if (!colorConfig.length) {
    return null
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
      itemConfig.color
    return color ? `  --color-${key}: ${color};` : null
  })
  .join("\n")}
}
`
          )
          .join("\n"),
      }}
    />
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
    React.ComponentProps<"div"> & {
      hideLabel?: boolean
      hideIndicator?: boolean
      indicator?: "line" | "dot" | "dashed"
      nameKey?: string
      labelKey?: string
    }
>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
    },
    ref
  ) => {
    const { config } = useChart()

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null
      }

      const [item] = payload
      const key = `${labelKey || item.dataKey || item.name || "value"}`
      const itemConfig = getPayloadConfigFromPayload(config, item, key)
      const value =
        !labelKey && typeof label === "string"
          ? config[label as keyof typeof config]?.label || label
          : itemConfig?.label

      if (labelFormatter) {
        return (
          <div className={cn("font-medium", labelClassName)}>
            {labelFormatter(value, payload)}
          </div>
        )
      }

      if (!value) {
        return null
      }

      return <div className={cn("font-medium", labelClassName)}>{value}</div>
    }, [
      label,
      labelFormatter,
      payload,
      hideLabel,
      labelClassName,
      config,
      labelKey,
    ])

    if (!active || !payload?.length) {
      return null
    }

    const nestLabel = payload.length === 1 && indicator !== "dot"

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
          className
        )}
      >
        {!nestLabel ? tooltipLabel : null}
        <div className="grid gap-1.5">
          {payload.map((item, index) => {
            const key = `${nameKey || item.name || item.dataKey || "value"}`
            const itemConfig = getPayloadConfigFromPayload(config, item, key)
            const indicatorColor = color || item.payload.fill || item.color

            return (
              <div
                key={item.dataKey}
                className={cn(
                  "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
                  indicator === "dot" && "items-center"
                )}
              >
                {formatter && item?.value !== undefined && item.name ? (
                  formatter(item.value, item.name, item, index, item.payload)
                ) : (
                  <>
                    {itemConfig?.icon ? (
                      <itemConfig.icon />
                    ) : (
                      !hideIndicator && (
                        <div
                          className={cn(
                            "shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]",
                            {
                              "h-2.5 w-2.5": indicator === "dot",
                              "w-1": indicator === "line",
                              "w-0 border-[1.5px] border-dashed bg-transparent":
                                indicator === "dashed",
                              "my-0.5": nestLabel && indicator === "dashed",
                            }
                          )}
                          style={
                            {
                              "--color-bg": indicatorColor,
                              "--color-border": indicatorColor,
                            } as React.CSSProperties
                          }
                        />
                      )
                    )}
                    <div
                      className={cn(
                        "flex flex-1 justify-between leading-none",
                        nestLabel ? "items-end" : "items-center"
                      )}
                    >
                      <div className="grid gap-1.5">
                        {nestLabel ? tooltipLabel : null}
                        <span className="text-muted-foreground">
                          {itemConfig?.label || item.name}
                        </span>
                      </div>
                      {item.value && (
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {item.value.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)
ChartTooltipContent.displayName = "ChartTooltip"

const ChartLegend = RechartsPrimitive.Legend

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> &
    Pick<RechartsPrimitive.LegendProps, "payload" | "verticalAlign"> & {
      hideIcon?: boolean
      nameKey?: string
    }
>(
  (
    { className, hideIcon = false, payload, verticalAlign = "bottom", nameKey },
    ref
  ) => {
    const { config } = useChart()

    if (!payload?.length) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center gap-4",
          verticalAlign === "top" ? "pb-3" : "pt-3",
          className
        )}
      >
        {payload.map((item) => {
          const key = `${nameKey || item.dataKey || "value"}`
          const itemConfig = getPayloadConfigFromPayload(config, item, key)

          return (
            <div
              key={item.value}
              className={cn(
                "flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground"
              )}
            >
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{
                    backgroundColor: item.color,
                  }}
                />
              )}
              {itemConfig?.label}
            </div>
          )
        })}
      </div>
    )
  }
)
ChartLegendContent.displayName = "ChartLegend"

// Helper to extract item config from a payload.
function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string
) {
  if (typeof payload !== "object" || payload === null) {
    return undefined
  }

  const payloadPayload =
    "payload" in payload &&
    typeof payload.payload === "object" &&
    payload.payload !== null
      ? payload.payload
      : undefined

  let configLabelKey: string = key

  if (
    key in payload &&
    typeof payload[key as keyof typeof payload] === "string"
  ) {
    configLabelKey = payload[key as keyof typeof payload] as string
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === "string"
  ) {
    configLabelKey = payloadPayload[
      key as keyof typeof payloadPayload
    ] as string
  }

  return configLabelKey in config
    ? config[configLabelKey]
    : config[key as keyof typeof config]
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
}
```
- src/components/ui/checkbox.tsx:
```tsx
"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
```
- src/components/ui/collapsible.tsx:
```tsx
"use client"

import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"

const Collapsible = CollapsiblePrimitive.Root

const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger

const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
```
- src/components/ui/dialog.tsx:
```tsx
"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
```
- src/components/ui/dropdown-menu.tsx:
```tsx
"use client"

import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "@/lib/utils"

const DropdownMenu = DropdownMenuPrimitive.Root

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

const DropdownMenuGroup = DropdownMenuPrimitive.Group

const DropdownMenuPortal = DropdownMenuPrimitive.Portal

const DropdownMenuSub = DropdownMenuPrimitive.Sub

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default gap-2 select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto" />
  </DropdownMenuPrimitive.SubTrigger>
))
DropdownMenuSubTrigger.displayName =
  DropdownMenuPrimitive.SubTrigger.displayName

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
DropdownMenuSubContent.displayName =
  DropdownMenuPrimitive.SubContent.displayName

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
))
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
))
DropdownMenuCheckboxItem.displayName =
  DropdownMenuPrimitive.CheckboxItem.displayName

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
))
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
      {...props}
    />
  )
}
DropdownMenuShortcut.displayName = "DropdownMenuShortcut"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
}
```
- src/components/ui/form.tsx:
```tsx
"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { Slot } from "@radix-ui/react-slot"
import {
  Controller,
  FormProvider,
  useFormContext,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

const Form = FormProvider

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
)

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const { getFieldState, formState } = useFormContext()

  const fieldState = getFieldState(fieldContext.name, formState)

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>")
  }

  const { id } = itemContext

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}

type FormItemContextValue = {
  id: string
}

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
)

const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  )
})
FormItem.displayName = "FormItem"

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField()

  return (
    <Label
      ref={ref}
      className={cn(error && "text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  )
})
FormLabel.displayName = "FormLabel"

const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  )
})
FormControl.displayName = "FormControl"

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField()

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
})
FormDescription.displayName = "FormDescription"

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message ?? "") : children

  if (!body) {
    return null
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  )
})
FormMessage.displayName = "FormMessage"

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
}
```
- src/components/ui/input.tsx:
```tsx
import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
```
- src/components/ui/label.tsx:
```tsx
"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
```
- src/components/ui/menubar.tsx:
```tsx
"use client"

import * as React from "react"
import * as MenubarPrimitive from "@radix-ui/react-menubar"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "@/lib/utils"

function MenubarMenu({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Menu>) {
  return <MenubarPrimitive.Menu {...props} />
}

function MenubarGroup({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Group>) {
  return <MenubarPrimitive.Group {...props} />
}

function MenubarPortal({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Portal>) {
  return <MenubarPrimitive.Portal {...props} />
}

function MenubarRadioGroup({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.RadioGroup>) {
  return <MenubarPrimitive.RadioGroup {...props} />
}

function MenubarSub({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Sub>) {
  return <MenubarPrimitive.Sub data-slot="menubar-sub" {...props} />
}

const Menubar = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Root
    ref={ref}
    className={cn(
      "flex h-10 items-center space-x-1 rounded-md border bg-background p-1",
      className
    )}
    {...props}
  />
))
Menubar.displayName = MenubarPrimitive.Root.displayName

const MenubarTrigger = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-3 py-1.5 text-sm font-medium outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
      className
    )}
    {...props}
  />
))
MenubarTrigger.displayName = MenubarPrimitive.Trigger.displayName

const MenubarSubTrigger = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubTrigger> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <MenubarPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </MenubarPrimitive.SubTrigger>
))
MenubarSubTrigger.displayName = MenubarPrimitive.SubTrigger.displayName

const MenubarSubContent = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
MenubarSubContent.displayName = MenubarPrimitive.SubContent.displayName

const MenubarContent = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Content>
>(
  (
    { className, align = "start", alignOffset = -4, sideOffset = 8, ...props },
    ref
  ) => (
    <MenubarPrimitive.Portal>
      <MenubarPrimitive.Content
        ref={ref}
        align={align}
        alignOffset={alignOffset}
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-[12rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className
        )}
        {...props}
      />
    </MenubarPrimitive.Portal>
  )
)
MenubarContent.displayName = MenubarPrimitive.Content.displayName

const MenubarItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <MenubarPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
MenubarItem.displayName = MenubarPrimitive.Item.displayName

const MenubarCheckboxItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <MenubarPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <MenubarPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </MenubarPrimitive.ItemIndicator>
    </span>
    {children}
  </MenubarPrimitive.CheckboxItem>
))
MenubarCheckboxItem.displayName = MenubarPrimitive.CheckboxItem.displayName

const MenubarRadioItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <MenubarPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <MenubarPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </MenubarPrimitive.ItemIndicator>
    </span>
    {children}
  </MenubarPrimitive.RadioItem>
))
MenubarRadioItem.displayName = MenubarPrimitive.RadioItem.displayName

const MenubarLabel = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <MenubarPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
MenubarLabel.displayName = MenubarPrimitive.Label.displayName

const MenubarSeparator = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
MenubarSeparator.displayName = MenubarPrimitive.Separator.displayName

const MenubarShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}
MenubarShortcut.displayname = "MenubarShortcut"

export {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarLabel,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarPortal,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarGroup,
  MenubarSub,
  MenubarShortcut,
}
```
- src/components/ui/popover.tsx:
```tsx
"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent }
```
- src/components/ui/progress.tsx:
```tsx
"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
```
- src/components/ui/radio-group.tsx:
```tsx
"use client"

import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { Circle } from "lucide-react"

import { cn } from "@/lib/utils"

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      className={cn("grid gap-2", className)}
      {...props}
      ref={ref}
    />
  )
})
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <Circle className="h-2.5 w-2.5 fill-current text-current" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
})
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

export { RadioGroup, RadioGroupItem }
```
- src/components/ui/scroll-area.tsx:
```tsx
"use client"

import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "@/lib/utils"

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn("relative overflow-hidden", className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
))
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" &&
        "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" &&
        "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
))
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName

export { ScrollArea, ScrollBar }
```
- src/components/ui/select.tsx:
```tsx
"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"

import { cn } from "@/lib/utils"

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}
```
- src/components/ui/separator.tsx:
```tsx
"use client"

import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "@/lib/utils"

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(
  (
    { className, orientation = "horizontal", decorative = true, ...props },
    ref
  ) => (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...props}
    />
  )
)
Separator.displayName = SeparatorPrimitive.Root.displayName

export { Separator }
```
- src/components/ui/sheet.tsx:
```tsx
"use client"

import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Sheet = SheetPrimitive.Root

const SheetTrigger = SheetPrimitive.Trigger

const SheetClose = SheetPrimitive.Close

const SheetPortal = SheetPrimitive.Portal

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
))
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

const sheetVariants = cva(
  "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom:
          "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right:
          "inset-y-0 right-0 h-full w-3/4  border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
)

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = "right", className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(sheetVariants({ side }), className)}
      {...props}
    >
      {children}
      <SheetPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </SheetPrimitive.Close>
    </SheetPrimitive.Content>
  </SheetPortal>
))
SheetContent.displayName = SheetPrimitive.Content.displayName

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
SheetHeader.displayName = "SheetHeader"

const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
SheetFooter.displayName = "SheetFooter"

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
))
SheetTitle.displayName = SheetPrimitive.Title.displayName

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
SheetDescription.displayName = SheetPrimitive.Description.displayName

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
```
- src/components/ui/sidebar.tsx:
```tsx
"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { VariantProps, cva } from "class-variance-authority"
import { PanelLeft } from "lucide-react"

import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const SIDEBAR_COOKIE_NAME = "sidebar_state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = "16rem"
const SIDEBAR_WIDTH_MOBILE = "18rem"
const SIDEBAR_WIDTH_ICON = "3rem"
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

type SidebarContext = {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContext | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }

  return context
}

const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    defaultOpen?: boolean
    open?: boolean
    onOpenChange?: (open: boolean) => void
  }
>(
  (
    {
      defaultOpen = true,
      open: openProp,
      onOpenChange: setOpenProp,
      className,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const isMobile = useIsMobile()
    const [openMobile, setOpenMobile] = React.useState(false)

    // This is the internal state of the sidebar.
    // We use openProp and setOpenProp for control from outside the component.
    const [_open, _setOpen] = React.useState(defaultOpen)
    const open = openProp ?? _open
    const setOpen = React.useCallback(
      (value: boolean | ((value: boolean) => boolean)) => {
        const openState = typeof value === "function" ? value(open) : value
        if (setOpenProp) {
          setOpenProp(openState)
        } else {
          _setOpen(openState)
        }

        // This sets the cookie to keep the sidebar state.
        document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
      },
      [setOpenProp, open]
    )

    // Helper to toggle the sidebar.
    const toggleSidebar = React.useCallback(() => {
      return isMobile
        ? setOpenMobile((open) => !open)
        : setOpen((open) => !open)
    }, [isMobile, setOpen, setOpenMobile])

    // Adds a keyboard shortcut to toggle the sidebar.
    React.useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (
          event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
          (event.metaKey || event.ctrlKey)
        ) {
          event.preventDefault()
          toggleSidebar()
        }
      }

      window.addEventListener("keydown", handleKeyDown)
      return () => window.removeEventListener("keydown", handleKeyDown)
    }, [toggleSidebar])

    // We add a state so that we can do data-state="expanded" or "collapsed".
    // This makes it easier to style the sidebar with Tailwind classes.
    const state = open ? "expanded" : "collapsed"

    const contextValue = React.useMemo<SidebarContext>(
      () => ({
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
      }),
      [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
    )

    return (
      <SidebarContext.Provider value={contextValue}>
        <TooltipProvider delayDuration={0}>
          <div
            style={
              {
                "--sidebar-width": SIDEBAR_WIDTH,
                "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
                ...style,
              } as React.CSSProperties
            }
            className={cn(
              "group/sidebar-wrapper flex min-h-svh w-full has-[[data-variant=inset]]:bg-sidebar",
              className
            )}
            ref={ref}
            {...props}
          >
            {children}
          </div>
        </TooltipProvider>
      </SidebarContext.Provider>
    )
  }
)
SidebarProvider.displayName = "SidebarProvider"

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    side?: "left" | "right"
    variant?: "sidebar" | "floating" | "inset"
    collapsible?: "offcanvas" | "icon" | "none"
  }
>(
  (
    {
      side = "left",
      variant = "sidebar",
      collapsible = "offcanvas",
      className,
      children,
      ...props
    },
    ref
  ) => {
    const { isMobile, state, openMobile, setOpenMobile } = useSidebar()

    if (collapsible === "none") {
      return (
        <div
          className={cn(
            "flex h-full w-[--sidebar-width] flex-col bg-sidebar text-sidebar-foreground",
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </div>
      )
    }

    if (isMobile) {
      return (
        <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
          <SheetContent
            data-sidebar="sidebar"
            data-mobile="true"
            className="w-[--sidebar-width] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
            style={
              {
                "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
              } as React.CSSProperties
            }
            side={side}
          >
            <SheetTitle className="sr-only">Mobile Sidebar</SheetTitle>
            <div className="flex h-full w-full flex-col">{children}</div>
          </SheetContent>
        </Sheet>
      )
    }

    return (
      <div
        ref={ref}
        className="group peer hidden md:block text-sidebar-foreground"
        data-state={state}
        data-collapsible={state === "collapsed" ? collapsible : ""}
        data-variant={variant}
        data-side={side}
      >
        {/* This is what handles the sidebar gap on desktop */}
        <div
          className={cn(
            "duration-200 relative h-svh w-[--sidebar-width] bg-transparent transition-[width] ease-linear",
            "group-data-[collapsible=offcanvas]:w-0",
            "group-data-[side=right]:rotate-180",
            variant === "floating" || variant === "inset"
              ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))]"
              : "group-data-[collapsible=icon]:w-[--sidebar-width-icon]"
          )}
        />
        <div
          className={cn(
            "duration-200 fixed inset-y-0 z-10 hidden h-svh w-[--sidebar-width] transition-[left,right,width] ease-linear md:flex",
            side === "left"
              ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
              : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
            // Adjust the padding for floating and inset variants.
            variant === "floating" || variant === "inset"
              ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4)_+2px)]"
              : "group-data-[collapsible=icon]:w-[--sidebar-width-icon] group-data-[side=left]:border-r group-data-[side=right]:border-l",
            className
          )}
          {...props}
        >
          <div
            data-sidebar="sidebar"
            className="flex h-full w-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow"
          >
            {children}
          </div>
        </div>
      </div>
    )
  }
)
Sidebar.displayName = "Sidebar"

const SidebarTrigger = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentProps<typeof Button>
>(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar } = useSidebar()

  return (
    <Button
      ref={ref}
      data-sidebar="trigger"
      variant="ghost"
      size="icon"
      className={cn("h-7 w-7", className)}
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      <PanelLeft />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
})
SidebarTrigger.displayName = "SidebarTrigger"

const SidebarRail = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button">
>(({ className, ...props }, ref) => {
  const { toggleSidebar } = useSidebar()

  return (
    <button
      ref={ref}
      data-sidebar="rail"
      aria-label="Toggle Sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Toggle Sidebar"
      className={cn(
        "absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-sidebar-border group-data-[side=left]:-right-4 group-data-[side=right]:left-0 sm:flex",
        "[[data-side=left]_&]:cursor-w-resize [[data-side=right]_&]:cursor-e-resize",
        "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
        "group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full group-data-[collapsible=offcanvas]:hover:bg-sidebar",
        "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
        "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
        className
      )}
      {...props}
    />
  )
})
SidebarRail.displayName = "SidebarRail"

const SidebarInset = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"main">
>(({ className, ...props }, ref) => {
  return (
    <main
      ref={ref}
      className={cn(
        "relative flex min-h-svh flex-1 flex-col bg-background",
        "peer-data-[variant=inset]:min-h-[calc(100svh-theme(spacing.4))] md:peer-data-[variant=inset]:m-2 md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow",
        className
      )}
      {...props}
    />
  )
})
SidebarInset.displayName = "SidebarInset"

const SidebarInput = React.forwardRef<
  React.ElementRef<typeof Input>,
  React.ComponentProps<typeof Input>
>(({ className, ...props }, ref) => {
  return (
    <Input
      ref={ref}
      data-sidebar="input"
      className={cn(
        "h-8 w-full bg-background shadow-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        className
      )}
      {...props}
    />
  )
})
SidebarInput.displayName = "SidebarInput"

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="header"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  )
})
SidebarHeader.displayName = "SidebarHeader"

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="footer"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  )
})
SidebarFooter.displayName = "SidebarFooter"

const SidebarSeparator = React.forwardRef<
  React.ElementRef<typeof Separator>,
  React.ComponentProps<typeof Separator>
>(({ className, ...props }, ref) => {
  return (
    <Separator
      ref={ref}
      data-sidebar="separator"
      className={cn("mx-2 w-auto bg-sidebar-border", className)}
      {...props}
    />
  )
})
SidebarSeparator.displayName = "SidebarSeparator"

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="content"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden",
        className
      )}
      {...props}
    />
  )
})
SidebarContent.displayName = "SidebarContent"

const SidebarGroup = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="group"
      className={cn("relative flex w-full min-w-0 flex-col p-2", className)}
      {...props}
    />
  )
})
SidebarGroup.displayName = "SidebarGroup"

const SidebarGroupLabel = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "div"

  return (
    <Comp
      ref={ref}
      data-sidebar="group-label"
      className={cn(
        "duration-200 flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 outline-none ring-sidebar-ring transition-[margin,opa] ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
        className
      )}
      {...props}
    />
  )
})
SidebarGroupLabel.displayName = "SidebarGroupLabel"

const SidebarGroupAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      ref={ref}
      data-sidebar="group-action"
      className={cn(
        "absolute right-3 top-3.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 after:md:hidden",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  )
})
SidebarGroupAction.displayName = "SidebarGroupAction"

const SidebarGroupContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="group-content"
    className={cn("w-full text-sm", className)}
    {...props}
  />
))
SidebarGroupContent.displayName = "SidebarGroupContent"

const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    data-sidebar="menu"
    className={cn("flex w-full min-w-0 flex-col gap-1", className)}
    {...props}
  />
))
SidebarMenu.displayName = "SidebarMenu"

const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    data-sidebar="menu-item"
    className={cn("group/menu-item relative", className)}
    {...props}
  />
))
SidebarMenuItem.displayName = "SidebarMenuItem"

const sidebarMenuButtonVariants = cva(
  "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        outline:
          "bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]",
      },
      size: {
        default: "h-8 text-sm",
        sm: "h-7 text-xs",
        lg: "h-12 text-sm group-data-[collapsible=icon]:!p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    asChild?: boolean
    isActive?: boolean
    tooltip?: string | React.ComponentProps<typeof TooltipContent>
  } & VariantProps<typeof sidebarMenuButtonVariants>
>(
  (
    {
      asChild = false,
      isActive = false,
      variant = "default",
      size = "default",
      tooltip,
      className,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button"
    const { isMobile, state } = useSidebar()

    const button = (
      <Comp
        ref={ref}
        data-sidebar="menu-button"
        data-size={size}
        data-active={isActive}
        className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
        {...props}
      />
    )

    if (!tooltip) {
      return button
    }

    if (typeof tooltip === "string") {
      tooltip = {
        children: tooltip,
      }
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent
          side="right"
          align="center"
          hidden={state !== "collapsed" || isMobile}
          {...tooltip}
        />
      </Tooltip>
    )
  }
)
SidebarMenuButton.displayName = "SidebarMenuButton"

const SidebarMenuAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    asChild?: boolean
    showOnHover?: boolean
  }
>(({ className, asChild = false, showOnHover = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      ref={ref}
      data-sidebar="menu-action"
      className={cn(
        "absolute right-1 top-1.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 peer-hover/menu-button:text-sidebar-accent-foreground [&>svg]:size-4 [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 after:md:hidden",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        showOnHover &&
          "group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 peer-data-[active=true]/menu-button:text-sidebar-accent-foreground md:opacity-0",
        className
      )}
      {...props}
    />
  )
})
SidebarMenuAction.displayName = "SidebarMenuAction"

const SidebarMenuBadge = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="menu-badge"
    className={cn(
      "absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums text-sidebar-foreground select-none pointer-events-none",
      "peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground",
      "peer-data-[size=sm]/menu-button:top-1",
      "peer-data-[size=default]/menu-button:top-1.5",
      "peer-data-[size=lg]/menu-button:top-2.5",
      "group-data-[collapsible=icon]:hidden",
      className
    )}
    {...props}
  />
))
SidebarMenuBadge.displayName = "SidebarMenuBadge"

const SidebarMenuSkeleton = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    showIcon?: boolean
  }
>(({ className, showIcon = false, ...props }, ref) => {
  // Random width between 50 to 90%.
  const width = React.useMemo(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`
  }, [])

  return (
    <div
      ref={ref}
      data-sidebar="menu-skeleton"
      className={cn("rounded-md h-8 flex gap-2 px-2 items-center", className)}
      {...props}
    >
      {showIcon && (
        <Skeleton
          className="size-4 rounded-md"
          data-sidebar="menu-skeleton-icon"
        />
      )}
      <Skeleton
        className="h-4 flex-1 max-w-[--skeleton-width]"
        data-sidebar="menu-skeleton-text"
        style={
          {
            "--skeleton-width": width,
          } as React.CSSProperties
        }
      />
    </div>
  )
})
SidebarMenuSkeleton.displayName = "SidebarMenuSkeleton"

const SidebarMenuSub = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    data-sidebar="menu-sub"
    className={cn(
      "mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5",
      "group-data-[collapsible=icon]:hidden",
      className
    )}
    {...props}
  />
))
SidebarMenuSub.displayName = "SidebarMenuSub"

const SidebarMenuSubItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ ...props }, ref) => <li ref={ref} {...props} />)
SidebarMenuSubItem.displayName = "SidebarMenuSubItem"

const SidebarMenuSubButton = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentProps<"a"> & {
    asChild?: boolean
    size?: "sm" | "md"
    isActive?: boolean
  }
>(({ asChild = false, size = "md", isActive, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "a"

  return (
    <Comp
      ref={ref}
      data-sidebar="menu-sub-button"
      data-size={size}
      data-active={isActive}
      className={cn(
        "flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground outline-none ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground",
        "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
        size === "sm" && "text-xs",
        size === "md" && "text-sm",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  )
})
SidebarMenuSubButton.displayName = "SidebarMenuSubButton"

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
}
```
- src/components/ui/skeleton.tsx:
```tsx
import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
```
- src/components/ui/slider.tsx:
```tsx
"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
      <SliderPrimitive.Range className="absolute h-full bg-primary" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
```
- src/components/ui/switch.tsx:
```tsx
"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
```
- src/components/ui/table.tsx:
```tsx
import * as React from "react"

import { cn } from "@/lib/utils"

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
```
- src/components/ui/tabs.tsx:
```tsx
"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
```
- src/components/ui/textarea.tsx:
```tsx
import * as React from 'react';

import {cn} from '@/lib/utils';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({className, ...props}, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export {Textarea};
```
- src/components/ui/toast.tsx:
```tsx
"use client"

import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive:
          "destructive group border-destructive bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}
```
- src/components/ui/toaster.tsx:
```tsx
"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
```
- src/components/ui/tooltip.tsx:
```tsx
"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
```
- src/firebase/client-provider.tsx:
```tsx
'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    // Initialize Firebase on the client side, once per component mount.
    return initializeFirebase();
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
```
- src/firebase/config.ts:
```ts
export const firebaseConfig = {
  "projectId": "studio-182085797-c7d81",
  "appId": "1:751471538706:web:3c1a730e676c276e82decb",
  "apiKey": "AIzaSyC0TkOUldYxKZw8ONktALH-5Pc_rnGriSk",
  "authDomain": "studio-182085797-c7d81.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "751471538706"
};
```
- src/firebase/error-emitter.ts:
```ts
'use client';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Defines the shape of all possible events and their corresponding payload types.
 * This centralizes event definitions for type safety across the application.
 */
export interface AppEvents {
  'permission-error': FirestorePermissionError;
}

// A generic type for a callback function.
type Callback<T> = (data: T) => void;

/**
 * A strongly-typed pub/sub event emitter.
 * It uses a generic type T that extends a record of event names to payload types.
 */
function createEventEmitter<T extends Record<string, any>>() {
  // The events object stores arrays of callbacks, keyed by event name.
  // The types ensure that a callback for a specific event matches its payload type.
  const events: { [K in keyof T]?: Array<Callback<T[K]>> } = {};

  return {
    /**
     * Subscribe to an event.
     * @param eventName The name of the event to subscribe to.
     * @param callback The function to call when the event is emitted.
     */
    on<K extends keyof T>(eventName: K, callback: Callback<T[K]>) {
      if (!events[eventName]) {
        events[eventName] = [];
      }
      events[eventName]?.push(callback);
    },

    /**
     * Unsubscribe from an event.
     * @param eventName The name of the event to unsubscribe from.
     * @param callback The specific callback to remove.
     */
    off<K extends keyof T>(eventName: K, callback: Callback<T[K]>) {
      if (!events[eventName]) {
        return;
      }
      events[eventName] = events[eventName]?.filter(cb => cb !== callback);
    },

    /**
     * Publish an event to all subscribers.
     * @param eventName The name of the event to emit.
     * @param data The data payload that corresponds to the event's type.
     */
    emit<K extends keyof T>(eventName: K, data: T[K]) {
      if (!events[eventName]) {
        return;
      }
      events[eventName]?.forEach(callback => callback(data));
    },
  };
}

// Create and export a singleton instance of the emitter, typed with our AppEvents interface.
export const errorEmitter = createEventEmitter<AppEvents>();
```
- src/firebase/errors.ts:
```ts
'use client';
import { getAuth, type User } from 'firebase/auth';

type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  requestResourceData?: any;
};

interface FirebaseAuthToken {
  name: string | null;
  email: string | null;
  email_verified: boolean;
  phone_number: string | null;
  sub: string;
  firebase: {
    identities: Record<string, string[]>;
    sign_in_provider: string;
    tenant: string | null;
  };
}

interface FirebaseAuthObject {
  uid: string;
  token: FirebaseAuthToken;
}

interface SecurityRuleRequest {
  auth: FirebaseAuthObject | null;
  method: string;
  path: string;
  resource?: {
    data: any;
  };
}

/**
 * Builds a security-rule-compliant auth object from the Firebase User.
 * @param currentUser The currently authenticated Firebase user.
 * @returns An object that mirrors request.auth in security rules, or null.
 */
function buildAuthObject(currentUser: User | null): FirebaseAuthObject | null {
  if (!currentUser) {
    return null;
  }

  const token: FirebaseAuthToken = {
    name: currentUser.displayName,
    email: currentUser.email,
    email_verified: currentUser.emailVerified,
    phone_number: currentUser.phoneNumber,
    sub: currentUser.uid,
    firebase: {
      identities: currentUser.providerData.reduce((acc, p) => {
        if (p.providerId) {
          acc[p.providerId] = [p.uid];
        }
        return acc;
      }, {} as Record<string, string[]>),
      sign_in_provider: currentUser.providerData[0]?.providerId || 'custom',
      tenant: currentUser.tenantId,
    },
  };

  return {
    uid: currentUser.uid,
    token: token,
  };
}

/**
 * Builds the complete, simulated request object for the error message.
 * It safely tries to get the current authenticated user.
 * @param context The context of the failed Firestore operation.
 * @returns A structured request object.
 */
function buildRequestObject(context: SecurityRuleContext): SecurityRuleRequest {
  let authObject: FirebaseAuthObject | null = null;
  try {
    // Safely attempt to get the current user.
    const firebaseAuth = getAuth();
    const currentUser = firebaseAuth.currentUser;
    if (currentUser) {
      authObject = buildAuthObject(currentUser);
    }
  } catch {
    // This will catch errors if the Firebase app is not yet initialized.
    // In this case, we'll proceed without auth information.
  }

  return {
    auth: authObject,
    method: context.operation,
    path: `/databases/(default)/documents/${context.path}`,
    resource: context.requestResourceData ? { data: context.requestResourceData } : undefined,
  };
}

/**
 * Builds the final, formatted error message for the LLM.
 * @param requestObject The simulated request object.
 * @returns A string containing the error message and the JSON payload.
 */
function buildErrorMessage(requestObject: SecurityRuleRequest): string {
  return `Missing or insufficient permissions: The following request was denied by Firestore Security Rules:
${JSON.stringify(requestObject, null, 2)}`;
}

/**
 * A custom error class designed to be consumed by an LLM for debugging.
 * It structures the error information to mimic the request object
 * available in Firestore Security Rules.
 */
export class FirestorePermissionError extends Error {
  public readonly request: SecurityRuleRequest;

  constructor(context: SecurityRuleContext) {
    const requestObject = buildRequestObject(context);
    super(buildErrorMessage(requestObject));
    this.name = 'FirebaseError';
    this.request = requestObject;
  }
}
```
- src/firebase/firestore/use-collection.tsx:
```tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useCollection hook.
 * @template T Type of the document data.
 */
export interface UseCollectionResult<T> {
  data: WithId<T>[] | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
}

/* Internal implementation of Query:
  https://github.com/firebase/firebase-js-sdk/blob/c5f08a9bc5da0d2b0207802c972d53724ccef055/packages/firestore/src/lite-api/reference.ts#L143
*/
export interface InternalQuery extends Query<DocumentData> {
  _query: {
    path: {
      canonicalString(): string;
      toString(): string;
    }
  }
}

/**
 * React hook to subscribe to a Firestore collection or query in real-time.
 * Handles nullable references/queries.
 * 
 *
 * IMPORTANT! YOU MUST MEMOIZE the inputted memoizedTargetRefOrQuery or BAD THINGS WILL HAPPEN
 * use useMemo to memoize it per React guidence.  Also make sure that it's dependencies are stable
 * references
 *  
 * @template T Optional type for document data. Defaults to any.
 * @param {CollectionReference<DocumentData> | Query<DocumentData> | null | undefined} targetRefOrQuery -
 * The Firestore CollectionReference or Query. Waits if null/undefined.
 * @returns {UseCollectionResult<T>} Object with data, isLoading, error.
 */
export function useCollection<T = any>(
    memoizedTargetRefOrQuery: ((CollectionReference<DocumentData> | Query<DocumentData>) & {__memo?: boolean})  | null | undefined,
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    if (!memoizedTargetRefOrQuery) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Directly use memoizedTargetRefOrQuery as it's assumed to be the final query
    const unsubscribe = onSnapshot(
      memoizedTargetRefOrQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const results: ResultItemType[] = [];
        for (const doc of snapshot.docs) {
          results.push({ ...(doc.data() as T), id: doc.id });
        }
        setData(results);
        setError(null);
        setIsLoading(false);
      },
      (error: FirestoreError) => {
        // This logic extracts the path from either a ref or a query
        const path: string =
          memoizedTargetRefOrQuery.type === 'collection'
            ? (memoizedTargetRefOrQuery as CollectionReference).path
            : (memoizedTargetRefOrQuery as unknown as InternalQuery)._query.path.canonicalString()

        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path,
        })

        setError(contextualError)
        setData(null)
        setIsLoading(false)

        // trigger global error propagation
        errorEmitter.emit('permission-error', contextualError);
      }
    );

    return () => unsubscribe();
  }, [memoizedTargetRefOrQuery]); // Re-run if the target query/reference changes.
  if(memoizedTargetRefOrQuery && !memoizedTargetRefOrQuery.__memo) {
    throw new Error(memoizedTargetRefOrQuery + ' was not properly memoized using useMemoFirebase');
  }
  return { data, isLoading, error };
}
```
- src/firebase/firestore/use-doc.tsx:
```tsx
'use client';
    
import { useState, useEffect } from 'react';
import {
  DocumentReference,
  onSnapshot,
  DocumentData,
  FirestoreError,
  DocumentSnapshot,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/** Utility type to add an 'id' field to a given type T. */
type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useDoc hook.
 * @template T Type of the document data.
 */
export interface UseDocResult<T> {
  data: WithId<T> | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
}

/**
 * React hook to subscribe to a single Firestore document in real-time.
 * Handles nullable references.
 * 
 * IMPORTANT! YOU MUST MEMOIZE the inputted memoizedTargetRefOrQuery or BAD THINGS WILL HAPPEN
 * use useMemo to memoize it per React guidence.  Also make sure that it's dependencies are stable
 * references
 *
 *
 * @template T Optional type for document data. Defaults to any.
 * @param {DocumentReference<DocumentData> | null | undefined} docRef -
 * The Firestore DocumentReference. Waits if null/undefined.
 * @returns {UseDocResult<T>} Object with data, isLoading, error.
 */
export function useDoc<T = any>(
  memoizedDocRef: DocumentReference<DocumentData> | null | undefined,
): UseDocResult<T> {
  type StateDataType = WithId<T> | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    if (!memoizedDocRef) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    // Optional: setData(null); // Clear previous data instantly

    const unsubscribe = onSnapshot(
      memoizedDocRef,
      (snapshot: DocumentSnapshot<DocumentData>) => {
        if (snapshot.exists()) {
          setData({ ...(snapshot.data() as T), id: snapshot.id });
        } else {
          // Document does not exist
          setData(null);
        }
        setError(null); // Clear any previous error on successful snapshot (even if doc doesn't exist)
        setIsLoading(false);
      },
      (error: FirestoreError) => {
        const contextualError = new FirestorePermissionError({
          operation: 'get',
          path: memoizedDocRef.path,
        })

        setError(contextualError)
        setData(null)
        setIsLoading(false)

        // trigger global error propagation
        errorEmitter.emit('permission-error', contextualError);
      }
    );

    return () => unsubscribe();
  }, [memoizedDocRef]); // Re-run if the memoizedDocRef changes.

  return { data, isLoading, error };
}
```
- src/firebase/index.ts:
```ts
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (!getApps().length) {
    // Important! initializeApp() is called without any arguments because Firebase App Hosting
    // integrates with the initializeApp() function to provide the environment variables needed to
    // populate the FirebaseOptions in production. It is critical that we attempt to call initializeApp()
    // without arguments.
    let firebaseApp;
    try {
      // Attempt to initialize via Firebase App Hosting environment variables
      firebaseApp = initializeApp();
    } catch (e) {
      // Only warn in production because it's normal to use the firebaseConfig to initialize
      // during development
      if (process.env.NODE_ENV === "production") {
        console.warn('Automatic initialization failed. Falling back to firebase config object.', e);
      }
      firebaseApp = initializeApp(firebaseConfig);
    }

    return getSdks(firebaseApp);
  }

  // If already initialized, return the SDKs with the already initialized App
  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
```
- src/firebase/non-blocking-login.tsx:
```tsx
'use client';
import {
  Auth, // Import Auth type for type hinting
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  UserCredential,
  GoogleAuthProvider,
  signInWithPopup,
  // Assume getAuth and app are initialized elsewhere
} from 'firebase/auth';

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  // CRITICAL: Call signInAnonymously directly. Do NOT use 'await signInAnonymously(...)'.
  signInAnonymously(authInstance).catch(error => {
    // Optional: Add basic logging for unhandled anonymous sign-in errors.
    // These are less critical to bubble up than user-facing errors.
    console.error("Anonymous sign-in failed:", error);
  });
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}

/** Initiate email/password sign-up (non-blocking). */
export async function initiateEmailSignUp(authInstance: Auth, email: string, password: string): Promise<UserCredential> {
  // We await here to be able to catch the error in the calling component.
  return await createUserWithEmailAndPassword(authInstance, email, password);
}

/** Initiate email/password sign-in (non-blocking). */
export async function initiateEmailSignIn(authInstance: Auth, email: string, password: string): Promise<UserCredential> {
  // We await here to be able to catch the error in the calling component.
  return await signInWithEmailAndPassword(authInstance, email, password);
}

/** Initiate Google sign-in (popup). */
export async function initiateGoogleSignIn(authInstance: Auth): Promise<UserCredential> {
  const provider = new GoogleAuthProvider();
  // We await here to be able to catch the error in the calling component.
  return await signInWithPopup(authInstance, provider);
}
```
- src/firebase/non-blocking-updates.tsx:
```tsx
'use client';
    
import {
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  CollectionReference,
  DocumentReference,
  SetOptions,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import {FirestorePermissionError} from '@/firebase/errors';

/**
 * Initiates a setDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function setDocumentNonBlocking(docRef: DocumentReference, data: any, options: SetOptions) {
  setDoc(docRef, data, options).catch(error => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: docRef.path,
        operation: 'write', // or 'create'/'update' based on options
        requestResourceData: data,
      })
    )
  })
  // Execution continues immediately
}


/**
 * Initiates an addDoc operation for a collection reference.
 * Does NOT await the write operation internally.
 * Returns the Promise for the new doc ref, but typically not awaited by caller.
 */
export function addDocumentNonBlocking(colRef: CollectionReference, data: any) {
  const promise = addDoc(colRef, data)
    .catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: colRef.path,
          operation: 'create',
          requestResourceData: data,
        })
      )
    });
  return promise;
}


/**
 * Initiates an updateDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function updateDocumentNonBlocking(docRef: DocumentReference, data: any) {
  updateDoc(docRef, data)
    .catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: data,
        })
      )
    });
}


/**
 * Initiates a deleteDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function deleteDocumentNonBlocking(docRef: DocumentReference) {
  deleteDoc(docRef)
    .catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: docRef.path,
          operation: 'delete',
        })
      )
    });
}
```
- src/firebase/provider.tsx:
```tsx
'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener'

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

// Internal state for user authentication
interface UserAuthState {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Combined state for the Firebase context
export interface FirebaseContextState {
  areServicesAvailable: boolean; // True if core services (app, firestore, auth instance) are provided
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null; // The Auth service instance
  // User authentication state
  user: User | null;
  isUserLoading: boolean; // True during initial auth check
  userError: Error | null; // Error from auth listener
}

// Return type for useFirebase()
export interface FirebaseServicesAndUser {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Return type for useUser() - specific to user auth state
export interface UserHookResult { // Renamed from UserAuthHookResult for consistency if desired, or keep as UserAuthHookResult
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// React Context
export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

/**
 * FirebaseProvider manages and provides Firebase services and user authentication state.
 */
export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    isUserLoading: true, // Start loading until first auth event
    userError: null,
  });

  // Effect to subscribe to Firebase auth state changes
  useEffect(() => {
    if (!auth) { // If no Auth service instance, cannot determine user state
      setUserAuthState({ user: null, isUserLoading: false, userError: new Error("Auth service not provided.") });
      return;
    }

    setUserAuthState({ user: null, isUserLoading: true, userError: null }); // Reset on auth instance change

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => { // Auth state determined
        setUserAuthState({ user: firebaseUser, isUserLoading: false, userError: null });
      },
      (error) => { // Auth listener error
        console.error("FirebaseProvider: onAuthStateChanged error:", error);
        setUserAuthState({ user: null, isUserLoading: false, userError: error });
      }
    );
    return () => unsubscribe(); // Cleanup
  }, [auth]); // Depends on the auth instance

  // Memoize the context value
  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      user: userAuthState.user,
      isUserLoading: userAuthState.isUserLoading,
      userError: userAuthState.userError,
    };
  }, [firebaseApp, firestore, auth, userAuthState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

/**
 * Hook to access core Firebase services and user authentication state.
 * Throws error if core services are not available or used outside provider.
 */
export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }

  if (!context.areServicesAvailable || !context.firebaseApp || !context.firestore || !context.auth) {
    throw new Error('Firebase core services not available. Check FirebaseProvider props.');
  }

  return {
    firebaseApp: context.firebaseApp,
    firestore: context.firestore,
    auth: context.auth,
    user: context.user,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
  };
};

/** Hook to access Firebase Auth instance. */
export const useAuth = (): Auth | null => {
  const context = useContext(FirebaseContext);
   if (context === undefined) {
    throw new Error('useAuth must be used within a FirebaseProvider.');
  }
  return context.auth;
};

/** Hook to access Firestore instance. */
export const useFirestore = (): Firestore | null => {
    const context = useContext(FirebaseContext);
   if (context === undefined) {
    throw new Error('useFirestore must be used within a FirebaseProvider.');
  }
  return context.firestore;
};

/** Hook to access Firebase App instance. */
export const useFirebaseApp = (): FirebaseApp | null => {
  const context = useContext(FirebaseContext);
   if (context === undefined) {
    throw new Error('useFirebaseApp must be used within a FirebaseProvider.');
  }
  return context.firebaseApp;
};

type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  
  return memoized;
}

/**
 * Hook specifically for accessing the authenticated user's state.
 * This provides the User object, loading status, and any auth errors.
 * @returns {UserHookResult} Object with user, isUserLoading, userError.
 */
export const useUser = (): UserHookResult => { // Renamed from useAuthUser
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a FirebaseProvider.');
  }
  return { 
    user: context.user, 
    isUserLoading: context.isUserLoading, 
    userError: context.userError 
  };
};
```
- src/hooks/use-mobile.tsx:
```tsx
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
```
- src/hooks/use-toast.ts:
```ts
"use client"

// Inspired by react-hot-toast library
import * as React from "react"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Toast = Omit<ToasterToast, "id">

function toast({ ...props }: Toast) {
  const id = genId()

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  return {
    id: id,
    dismiss,
    update,
  }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }
```
- src/lib/data.ts:
```ts
export type Student = {
  id: string;
  name: string;
  attendance: number;
  overallGrade: string;
};

export type Material = {
  id: string;
  title: string;
  type: 'Notes' | 'DPP' | 'Test' | 'Solution';
  subject: string;
  chapter: string;
  date: string;
  isNew?: boolean;
};

export const teacherData = {
  name: "Dr. Evelyn Reed",
  id: "TID-84321",
  avatarUrl: 'https://picsum.photos/seed/teacher-avatar/100/100',
  studentRequests: [],
  enrolledStudents: [
    { id: 'S001', name: 'Alice Johnson', grade: 'A', attendance: 95, avatarUrl: 'https://picsum.photos/seed/S001/40/40', batch: 'Morning Physics' },
    { id: 'S002', name: 'Bob Williams', grade: 'B', attendance: 88, avatarUrl: 'https://picsum.photos/seed/S002/40/40', batch: 'Evening Chemistry' },
    { id: 'S003', name: 'Charlie Davis', avatarUrl: 'https://picsum.photos/seed/S003/40/40', grade: 'N/A', attendance: 100, createdAt: new Date('2023-10-27T10:00:00Z') },
    { id: 'S004', name: 'Diana Prince', avatarUrl: 'https://picsum.photos/seed/S004/40/40', grade: 'N/A', attendance: 100, createdAt: new Date('2023-10-27T10:00:00Z') }
  ],
  schedule: [
    { id: 'sch-1', topic: 'Algebra Basics', subject: 'Mathematics', date: new Date(new Date().setDate(new Date().getDate() + 1)), time: '10:00 AM', type: 'Online', locationOrLink: 'https://meet.google.com/xyz-abc-pqr', status: 'Scheduled' },
    { id: 'sch-2', topic: 'Linear Equations', subject: 'Mathematics', date: new Date(new Date().setDate(new Date().getDate() + 2)), time: '11:00 AM', type: 'Offline', locationOrLink: 'Classroom 5', status: 'Scheduled' },
    { id: 'sch-3', topic: 'Thermodynamics', subject: 'Physics', date: new Date(new Date().setDate(new Date().getDate() + 3)), time: '02:00 PM', type: 'Online', locationOrLink: 'https://meet.google.com/def-ghi-jkl', status: 'Scheduled' }
  ],
  classStatus: 'Open',
  subjects: ['Mathematics', 'Physics', 'Chemistry'],
  batches: [
    { id: 'batch1', name: 'Morning Physics', createdAt: new Date() },
    { id: 'batch2', name: 'Evening Chemistry', createdAt: new Date() },
  ],
  studyMaterials: [
    { id: 'M01', title: 'Algebra Chapter 1 Notes', type: 'Notes', subject: 'Math', chapter: '1', date: '3 days ago', isNew: true },
    { id: 'M02', title: 'DPP - Linear Equations', type: 'DPP', subject: 'Math', chapter: '2', date: '2 days ago', isNew: true },
    { id: 'M03', title: 'Physics Chapter 1 Test', type: 'Test', subject: 'Physics', chapter: '1', date: '1 day ago', isNew: true },
    { id: 'M04', title: 'Chemistry Formula Sheet', type: 'Notes', subject: 'Chemistry', chapter: 'Revision', date: '5 days ago' },
    { id: 'M05', title: 'DPP - Kinematics', type: 'DPP', subject: 'Physics', chapter: '3', date: '4 days ago', isNew: false },
  ],
  performance: [
    { name: 'Unit 1', score: 85 },
    { name: 'Unit 2', score: 92 },
    { name: 'Midterm', score: 88 },
    { name: 'Unit 3', score: 95 },
    { name: 'Final', score: 91 },
  ],
  attendanceRecords: [
    { date: '2024-07-29', status: 'Present' },
    { date: '2024-07-28', status: 'Present' },
    { date: '2024-07-27', status: 'Absent' },
    { date: '2024-07-26', status: 'Present' },
  ]
};

export const studentData = {
  name: "Alice Johnson",
  id: "SID-12345",
  avatarUrl: 'https://picsum.photos/seed/student-avatar/100/100',
  isConnected: false,
  stats: {
    newDpps: 2,
    pendingSubmissions: 1,
    attendance: 95,
  },
  // Data below will be replaced by teacher data upon connection
  performance: teacherData.performance,
  studyMaterials: teacherData.studyMaterials,
  attendanceRecords: teacherData.attendanceRecords,
  schedule: teacherData.schedule,
};

export const parentData = {
    name: 'Mr. Johnson',
    avatarUrl: 'https://picsum.photos/seed/parent-avatar/100/100',
};
```
- src/lib/placeholder-images.json:
```json
{
  "placeholderImages": [
    {
      "id": "hero",
      "description": "A student learning on a tablet in a modern classroom setting.",
      "imageUrl": "https://images.unsplash.com/photo-1599689868384-59cb2b01bb21?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw5fHxlZHVjYXRpb24lMjBsZWFybmluZ3xlbnwwfHx8fDE3Njc3NjY0Mjh8MA&ixlib=rb-4.1.0&q=80&w=1080",
      "imageHint": "education learning"
    },
    {
      "id": "teacher-avatar",
      "description": "Avatar for a teacher.",
      "imageUrl": "https://images.unsplash.com/photo-1732612712493-e81f9f9efc6e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw2fHx0ZWFjaGVyJTIwcG9ydHJhaXR8ZW58MHx8fHwxNzY3NjY0NzUwfDA&ixlib=rb-4.1.0&q=80&w=1080",
      "imageHint": "teacher portrait"
    },
    {
      "id": "student-avatar",
      "description": "Avatar for a student.",
      "imageUrl": "https://images.unsplash.com/photo-1517841905240-472988babdf9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw4fHxzdHVkZW50JTIwcG9ydHJhaXR8ZW58MHx8fHwxNzY3NzAwMDkzfDA&ixlib=rb-4.1.0&q=80&w=1080",
      "imageHint": "student portrait"
    },
    {
      "id": "parent-avatar",
      "description": "Avatar for a parent.",
      "imageUrl": "https://images.unsplash.com/photo-1767411972723-4bdcab47c113?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw2fHxwYXJlbnQlMjBwb3J0cmFpdHxlbnwwfHx8fDE3Njc3NTIxNzB8MA&ixlib=rb-4.1.0&q=80&w=1080",
      "imageHint": "parent portrait"
    },
    {
      "id": "feature1",
      "description": "Teacher managing her class on a digital board.",
      "imageUrl": "https://images.unsplash.com/photo-1577896851231-70ef18881754?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHx0ZWFjaGVyJTIwY2xhc3Nyb29tfGVufDB8fHx8MTc2Nzc2NjQyOHww&ixlib=rb-4.1.0&q=80&w=1080",
      "imageHint": "teacher classroom"
    },
    {
      "id": "feature2",
      "description": "Student studying on a laptop with headphones.",
      "imageUrl": "https://images.unsplash.com/photo-1669146894279-509f5de45390?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw2fHxzdHVkZW50JTIwc3R1ZHlpbmd8ZW58MHx8fHwxNzY3NzE2NDk1fDA&ixlib=rb-4.1.0&q=80&w=1080",
      "imageHint": "student studying"
    },
    {
      "id": "feature3",
      "description": "Parent checking student progress on a phone.",
      "imageUrl": "https://images.unsplash.com/photo-1754536511892-7354a21f0275?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw4fHxwYXJlbnQlMjBwaG9uZXxlbnwwfHx8fDE3Njc3NjY0Mjh8MA&ixlib=rb-4.1.0&q=80&w=1080",
      "imageHint": "parent phone"
    }
  ]
}
```
- src/lib/placeholder-images.ts:
```ts
import data from './placeholder-images.json';

export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
};

export const PlaceHolderImages: ImagePlaceholder[] = data.placeholderImages;
```
- src/lib/utils.ts:
```ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```
- tailwind.config.ts:
```ts
import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        body: ['"PT Sans"', 'sans-serif'],
        headline: ['"Playfair Display"', 'serif'],
        code: ['monospace'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
```
- tsconfig.json:
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

The following Python libraries are available:

`default_api`:
```python
def RequestFirebaseBackendTool(
) -> dict:
  """If the user requests a modification to the app involving a Firestore database, or
  Firebase Authentication, this function MUST be called first to set up the necessary scaffolding,
  which will include following:

  - Create a new Firebase Project (or retrieve the current project)
  - Provision Firestore and/or Firebase Auth
  - Bootstrap initial Firestore and Firebase Auth code scaffolding
  - Bootstrap backend.json and firestore.rules files

  See the 'Firebase Usage Instructions' for more details on working with code scaffolding.

  Args:
  """


def UpdateFirebaseProjectTool(
    firebaseProjectId: str,
) -> dict:
  """Updates the user's Firebase configuration in their application code and their active Firebase Project. This function should be called anytime the user requests to change the Firebase Project they are using, or if they edit their Firebase configuration file (typically called firebaseConfig and/or in a file named `firebase/config.ts`)

  Args:
    firebaseProjectId: The Firebase Project ID to switch to.
  """


def RequestFirebaseProjectWithConfig(
) -> dict:
  """
    Creates a new Firebase Project or retrieves the current project and provides a Firebase app
    config object.

    Call this function whenever the user requests Firebase or services that Firebase offers.
    Includes adding, enabling, connecting with, or integrating with Firebase and Firebase services.
    When this function is called, you must always begin by giving the user a detailed outline of
    your plan and what you are going to do on their behalf.

    For example, call this function for user requests such as "Create a Firebase Project", "Get
    a Firebase config object", "Create a Firebase App Config", "Show me my Firebase config object",
    "Can you show me my Firebase configuration?, "What value do I use in the initializeApp()
    function?", "Add Firebase Auth", "Add Firebase Remote Config", or "Add analytics".

    Calling this function does not add, connect to, or integrate services, nor deploy Firebase
    resources on the user's behalf. As such, you must not tell users that they are connected to a
    service, that an automated deployment will occur, or that the integration is set up or complete.
    You must tell users that as a next step, they will need to go to the Firebase console to
    continue setting up, adding, or enabling any services they requested.

    This function does not generate code for additional services, intergrations, or features that
    the user did not ask for.

    Important! The Firebase App Configuration object is a public configuration, meaning
    it is safe and secure to provide the user with this object as the security and access is
    enforced by the Security Rules or Firebase App Check. Once written, do not modify the
    firebaseConfig object because it is fetched from the server and does not require modifications
    under any circumstances.
    

  Args:
  """

```