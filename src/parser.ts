/**
 * A2UI LLM Output Parser
 * Extracts A2UI JSON from LLM responses
 */

import type { A2UIServerMessage } from "./types";

export interface A2UIParseResult {
  text: string;
  a2uiMessages: A2UIServerMessage[];
  parseError?: string;
}

/**
 * Parse A2UI messages from LLM output
 * Looks for A2UI JSON blocks with ---a2ui_JSON--- delimiters
 * Format: "text response\n---a2ui_JSON---\n[...json array...]\n"
 */
export function parseA2UIResponse(llmOutput: string): A2UIParseResult {
  if (!llmOutput || typeof llmOutput !== "string") {
    return {
      text: "",
      a2uiMessages: [],
      parseError: "LLM output must be a non-empty string",
    };
  }

  // Split by delimiter
  const parts = llmOutput.split("---a2ui_JSON---");

  if (parts.length === 1) {
    // No A2UI JSON found - return text only
    return {
      text: llmOutput,
      a2uiMessages: [],
    };
  }

  const text = parts[0].trim();
  const jsonBlock = parts.slice(1).join("---a2ui_JSON---"); // Rejoin if multiple delimiters

  try {
    // Try to extract JSON from code block (with or without language tag)
    let jsonStr = jsonBlock;

    // Look for markdown code blocks
    const codeBlockMatch = jsonBlock.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    } else {
      // Try direct JSON parsing
      jsonStr = jsonBlock.trim();
    }

    // Parse JSON
    let parsed: any;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      // Try to extract JSON array from partial text
      const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
      if (!arrayMatch) {
        throw new Error("Could not find valid JSON array");
      }
      parsed = JSON.parse(arrayMatch[0]);
    }

    if (!Array.isArray(parsed)) {
      return {
        text,
        a2uiMessages: [],
        parseError: "A2UI JSON must be an array of messages",
      };
    }

    return {
      text,
      a2uiMessages: parsed as A2UIServerMessage[],
    };
  } catch (err) {
    return {
      text,
      a2uiMessages: [],
      parseError: `Failed to parse A2UI JSON: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Extract surface ID from A2UI messages
 * Returns the first surfaceId found in createSurface message
 */
export function extractSurfaceId(messages: A2UIServerMessage[]): string | undefined {
  for (const msg of messages) {
    if ("createSurface" in msg) {
      return msg.createSurface.surfaceId;
    }
  }
  return undefined;
}

/**
 * Group messages by surface ID
 */
export function groupMessagesBySurface(messages: A2UIServerMessage[]): Map<string, A2UIServerMessage[]> {
  const grouped = new Map<string, A2UIServerMessage[]>();

  for (const msg of messages) {
    let surfaceId: string | undefined;

    if ("createSurface" in msg) {
      surfaceId = msg.createSurface.surfaceId;
    } else if ("updateComponents" in msg) {
      surfaceId = msg.updateComponents.surfaceId;
    } else if ("updateDataModel" in msg) {
      surfaceId = msg.updateDataModel.surfaceId;
    } else if ("deleteSurface" in msg) {
      surfaceId = msg.deleteSurface.surfaceId;
    }

    if (surfaceId) {
      if (!grouped.has(surfaceId)) {
        grouped.set(surfaceId, []);
      }
      grouped.get(surfaceId)!.push(msg);
    }
  }

  return grouped;
}

/**
 * Get data model updates from messages
 */
export function extractDataModel(messages: A2UIServerMessage[]): Map<string, any> {
  const dataModel = new Map<string, any>();

  for (const msg of messages) {
    if ("updateDataModel" in msg) {
      const { path, value } = msg.updateDataModel;
      dataModel.set(path, value);
    }
  }

  return dataModel;
}

/**
 * Get component definitions from messages
 */
export function extractComponents(messages: A2UIServerMessage[]): Map<string, any> {
  const components = new Map<string, any>();

  for (const msg of messages) {
    if ("updateComponents" in msg) {
      const { components: comps } = msg.updateComponents;
      for (const comp of comps) {
        components.set(comp.id, comp);
      }
    }
  }

  return components;
}

/**
 * Check if messages sequence is valid (createSurface first, etc.)
 */
export function validateMessageSequence(messages: A2UIServerMessage[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (messages.length === 0) {
    errors.push("Messages array is empty");
    return { valid: false, errors };
  }

  // Check first message is createSurface
  if (!("createSurface" in messages[0])) {
    errors.push("First message must be createSurface");
  }

  // Track surfaces created vs deleted
  const createdSurfaces = new Set<string>();
  for (const msg of messages) {
    if ("createSurface" in msg) {
      const surfaceId = msg.createSurface.surfaceId;
      if (createdSurfaces.has(surfaceId)) {
        errors.push(`Surface ${surfaceId} created multiple times`);
      }
      createdSurfaces.add(surfaceId);
    }
  }

  // Check references to created surfaces
  for (const msg of messages) {
    let surfaceId: string | undefined;
    if ("updateComponents" in msg) {
      surfaceId = msg.updateComponents.surfaceId;
    } else if ("updateDataModel" in msg) {
      surfaceId = msg.updateDataModel.surfaceId;
    } else if ("deleteSurface" in msg) {
      surfaceId = msg.deleteSurface.surfaceId;
    }

    if (surfaceId && !createdSurfaces.has(surfaceId)) {
      errors.push(`Reference to non-existent surface: ${surfaceId}`);
    }
  }

  return { valid: errors.length === 0, errors };
}
