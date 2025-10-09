const HUGGING_FACE_API_KEY = import.meta.env.VITE_HUGGING_FACE_API_KEY
const HUGGING_FACE_API_URL = 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium'

export async function generateGhostText(prompt, type = 'product') {
  try {
    // Check if API key is available
    if (!HUGGING_FACE_API_KEY) {
      console.warn('Hugging Face API key not found. Using fallback suggestions.')
      return generateSimpleGhostText(type)
    }

    // Create context-specific prompts for different review types
    const prompts = {
      product: `Write a helpful product review suggestion for: "${prompt}". Keep it concise and helpful:`,
      delivery: `Write a helpful delivery review suggestion for: "${prompt}". Keep it concise and helpful:`,
      general: `Write a helpful review suggestion for: "${prompt}". Keep it concise and helpful:`
    }

    const response = await fetch(HUGGING_FACE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HUGGING_FACE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompts[type] || prompts.general,
        parameters: {
          max_length: 100,
          temperature: 0.7,
          do_sample: true,
          return_full_text: false
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (Array.isArray(data) && data.length > 0 && data[0].generated_text) {
      return data[0].generated_text.trim()
    }
    
    return null
  } catch (error) {
    console.error('Error generating ghost text:', error)
    return null
  }
}

// Alternative simpler text generation for fallback
export function generateSimpleGhostText(type = 'product') {
  const suggestions = {
    product: [
      "Great quality and fast delivery!",
      "Product met my expectations perfectly.",
      "Good value for money, would recommend.",
      "Excellent product, arrived on time.",
      "Very satisfied with this purchase."
    ],
    delivery: [
      "Driver was professional and on time.",
      "Fast and efficient delivery service.",
      "Driver was friendly and helpful.",
      "Delivery was quick and secure.",
      "Great delivery experience overall."
    ]
  }
  
  const typeSuggestions = suggestions[type] || suggestions.product
  return typeSuggestions[Math.floor(Math.random() * typeSuggestions.length)]
}

