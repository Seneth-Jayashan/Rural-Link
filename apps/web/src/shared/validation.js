// Validation utility functions for form validation

export const validationRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address'
  },
  password: {
    required: true,
    minLength: 6,
    message: 'Password must be at least 6 characters long'
  },
  phone: {
    required: true,
    pattern: /^[\+]?[0-9\s\-\(\)]{7,15}$/,
    message: 'Please enter a valid phone number'
  },
  name: {
    required: true,
    minLength: 1,
    message: 'This field is required'
  },
  price: {
    required: true,
    min: 0.01,
    message: 'Please enter a valid price greater than 0'
  },
  stock: {
    required: true,
    min: 0,
    message: 'Please enter a valid stock quantity (0 or greater)'
  },
  address: {
    required: true,
    minLength: 1,
    message: 'This address field is required'
  }
}

export const validateField = (value, rule) => {
  if (rule.required && (!value || !value.trim())) {
    return rule.message || 'This field is required'
  }

  if (value && rule.pattern && !rule.pattern.test(value)) {
    return rule.message || 'Invalid format'
  }

  if (value && rule.minLength && value.trim().length < rule.minLength) {
    return rule.message || `Minimum length is ${rule.minLength} characters`
  }

  if (value && rule.min !== undefined) {
    const numValue = parseFloat(value)
    if (isNaN(numValue) || numValue < rule.min) {
      return rule.message || `Value must be at least ${rule.min}`
    }
  }

  return null
}

export const validateForm = (formData, rules) => {
  const errors = {}
  
  for (const [fieldName, rule] of Object.entries(rules)) {
    const value = formData[fieldName]
    const error = validateField(value, rule)
    if (error) {
      errors[fieldName] = error
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

export const validateNestedForm = (formData, rules) => {
  const errors = {}
  
  for (const [fieldPath, rule] of Object.entries(rules)) {
    const value = getNestedValue(formData, fieldPath)
    const error = validateField(value, rule)
    if (error) {
      errors[fieldPath] = error
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

const getNestedValue = (obj, path) => {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

// Common validation patterns
export const commonValidations = {
  register: {
    firstName: validationRules.name,
    lastName: validationRules.name,
    email: validationRules.email,
    password: validationRules.password,
    phone: validationRules.phone,
    'address.street': validationRules.address,
    'address.city': validationRules.address,
    'address.state': validationRules.address,
    'address.zipCode': validationRules.address,
    'address.country': validationRules.address
  },
  login: {
    email: validationRules.email,
    password: validationRules.password
  },
  product: {
    name: validationRules.name,
    price: validationRules.price,
    stock: validationRules.stock
  },
  checkout: {
    name: validationRules.name,
    phone: validationRules.phone,
    'address.street': validationRules.address,
    'address.city': validationRules.address,
    'address.state': validationRules.address,
    'address.zipCode': validationRules.address,
    'address.country': validationRules.address
  },
  accountEdit: {
    firstName: validationRules.name,
    lastName: validationRules.name,
    phone: { ...validationRules.phone, required: false } // Optional for account edit
  }
}
