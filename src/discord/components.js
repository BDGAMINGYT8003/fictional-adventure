import { ButtonStyle, ComponentType, TextInputStyle } from './constants.js';

export function actionRow(...components) {
  return { type: ComponentType.ACTION_ROW, components: components.flat() };
}

export function button({ customId, label, style = ButtonStyle.PRIMARY, url, disabled = false }) {
  const component = { type: ComponentType.BUTTON, style, label, disabled };
  if (style === ButtonStyle.LINK) component.url = url;
  else component.custom_id = customId;
  return component;
}

export function shortTextInput({ customId, label, required = true, placeholder, minLength, maxLength }) {
  const component = {
    type: ComponentType.TEXT_INPUT,
    custom_id: customId,
    label,
    style: TextInputStyle.SHORT,
    required,
  };
  if (placeholder) component.placeholder = placeholder;
  if (minLength !== undefined) component.min_length = minLength;
  if (maxLength !== undefined) component.max_length = maxLength;
  return component;
}
