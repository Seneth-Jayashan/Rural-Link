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

// Generate next word suggestions based on current input
export async function generateNextWord(currentText, type = 'product') {
  try {
    // Check if API key is available
    if (!HUGGING_FACE_API_KEY) {
      return getSimpleWordSuggestion(currentText, type)
    }

    // Create context-specific prompts for word completion
    const prompts = {
      product: `Complete this product review: "${currentText}"`,
      delivery: `Complete this delivery review: "${currentText}"`,
      general: `Complete this review: "${currentText}"`
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
          max_length: 20, // Shorter for word suggestions
          temperature: 0.8,
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
      // Extract just the next few words
      const generated = data[0].generated_text.trim()
      const words = generated.split(' ')
      return words.slice(0, 3).join(' ') // Return next 1-3 words
    }
    
    return getSimpleWordSuggestion(currentText, type)
  } catch (error) {
    console.error('Error generating next word:', error)
    return getSimpleWordSuggestion(currentText, type)
  }
}

// Simple word suggestions based on context
function getSimpleWordSuggestion(currentText, type) {
  const text = currentText.toLowerCase()
  
  if (type === 'product') {
    if (text.includes('great') || text.includes('good') || text.includes('excellent')) {
      return 'quality and'
    }
    if (text.includes('fast') || text.includes('quick')) {
      return 'delivery!'
    }
    if (text.includes('would') || text.includes('recommend')) {
      return 'to others.'
    }
    if (text.includes('product') || text.includes('item')) {
      return 'was amazing!'
    }
    return 'and satisfied!'
  }
  
  if (type === 'delivery') {
    if (text.includes('driver') || text.includes('courier')) {
      return 'was professional.'
    }
    if (text.includes('fast') || text.includes('quick')) {
      return 'and efficient!'
    }
    if (text.includes('friendly') || text.includes('helpful')) {
      return 'and courteous.'
    }
    if (text.includes('delivery') || text.includes('service')) {
      return 'was excellent!'
    }
    return 'and on time!'
  }
  
  return 'and great!'
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

