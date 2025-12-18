import * as React from 'react'

const SearchHighlightContext = React.createContext<string>('')

export const SearchHighlightProvider = SearchHighlightContext.Provider

export function useSearchHighlight() {
  return React.useContext(SearchHighlightContext)
}

interface HighlightTextProps {
  text: string
  className?: string
}

export const HighlightText = React.memo(function HighlightText({
  text,
  className,
}: HighlightTextProps) {
  const searchQuery = useSearchHighlight()

  const parts = React.useMemo(() => {
    if (!searchQuery || !text) {
      return null
    }

    const query = searchQuery.toLowerCase()
    const textLower = text.toLowerCase()
    const queryIndex = textLower.indexOf(query)

    // No match found
    if (queryIndex === -1) {
      return null
    }

    // Split text into parts: before, match, after
    const before = text.slice(0, queryIndex)
    const match = text.slice(queryIndex, queryIndex + query.length)
    const after = text.slice(queryIndex + query.length)

    return { before, match, after }
  }, [text, searchQuery])

  // No search query or no match - render plain text
  if (!parts) {
    return <span className={className}>{text}</span>
  }

  return (
    <span className={className}>
      {parts.before}
      <mark className="bg-yellow-200 dark:bg-yellow-500/40 text-inherit rounded-sm px-0.5">
        {parts.match}
      </mark>
      {parts.after}
    </span>
  )
})
