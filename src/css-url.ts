import { contextFetch } from './fetch'
import { consoleWarn, isDataUrl, resolveUrl } from './utils'
import type { Context } from './context'

export async function replaceCssUrlToDataUrl(
  cssText: string,
  baseUrl: string | null,
  context: Context,
  isImage?: boolean,
): Promise<string> {
  if (!hasCssUrl(cssText)) return cssText

  for (const url of parseCssUrls(cssText)) {
    try {
      const dataUrl = await contextFetch(
        context,
        {
          url: baseUrl
            ? resolveUrl(url, baseUrl)
            : url,
          requestType: isImage ? 'image' : 'text',
          responseType: 'base64',
        },
      )
      cssText = cssText.replace(toRE(url), `$1${ dataUrl }$3`)
    } catch (error) {
      consoleWarn('Failed to fetch css data url', url, error)
    }
  }

  return cssText
}

export function hasCssUrl(cssText: string): boolean {
  return /url\((['"]?)([^'"]+?)\1\)/.test(cssText)
}

function parseCssUrls(cssText: string): string[] {
  const result: string[] = []

  cssText.replace(/url\((['"]?)([^'"]+?)\1\)/g, (raw, quotation, url) => {
    result.push(url)
    return raw
  })

  return result.filter((url) => !isDataUrl(url))
}

function toRE(url: string): RegExp {
  // eslint-disable-next-line no-useless-escape
  const escaped = url.replace(/([.*+?^${}()|\[\]\/\\])/g, '\\$1')
  return new RegExp(`(url\\(['"]?)(${ escaped })(['"]?\\))`, 'g')
}
