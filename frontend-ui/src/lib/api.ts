const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8787";

export interface JobResponse {
  jobId: string;
  status: "completed" | "failed" | "in_progress";
  result: string; // Preview shown before payment
  fullResult?: string; // Full code/work shown after payment
  invoice?: {
    amount: string;
    currency: string;
    to: string;
    description: string;
  };
  priceComparison?: {
    specialization: string;
    options: Array<{
      name: string;
      rate: string;
      address: string;
    }>;
    selected: {
      name: string;
      rate: string;
      address: string;
    };
  };
}

export async function sendRequestToManager(message: string): Promise<JobResponse> {
  const response = await fetch(`${BACKEND_URL}/manager`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const error = await response.json();
      errorMessage = error.error || errorMessage;
    } catch {
      // If JSON parsing fails, try to get text
      try {
        const errorText = await response.text();
        errorMessage = errorText || errorMessage;
      } catch {
        // Use default error message
      }
    }
    throw new Error(errorMessage);
  }

  // Get response text first to check if it's valid JSON
  const responseText = await response.text();
  
  if (!responseText || responseText.trim().length === 0) {
    throw new Error("Empty response from server");
  }

  try {
    const jsonData = JSON.parse(responseText);
    
    // Validate response structure
    if (!jsonData || typeof jsonData !== 'object') {
      throw new Error("Invalid response structure");
    }
    
    if (!jsonData.result && !jsonData.error) {
      throw new Error("Missing required 'result' field in response");
    }
    
    return jsonData as JobResponse;
  } catch (parseError) {
    console.error("JSON Parse Error:", parseError);
    console.error("Response text:", responseText.substring(0, 500));
    throw new Error(`Invalid JSON response: ${parseError instanceof Error ? parseError.message : "Unknown parse error"}`);
  }
}

export async function processRequest(request: string): Promise<JobResponse> {
  const response = await fetch(`${BACKEND_URL}/process`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ request }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}


