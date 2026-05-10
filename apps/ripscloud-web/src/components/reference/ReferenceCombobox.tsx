import { useMemo, useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { cn } from '@/lib/utils'
import type { ReferenceOption } from '@/lib/reference-data/types'

export interface ReferenceComboboxMessages {
  searchPlaceholder: string
  noResults: string
  noResultsForQuery: (query: string) => string
  resultsLimited: (count: number, total: number) => string
}

export interface ReferenceComboboxProps {
  id?: string
  className?: string
  value?: string
  selectedOption?: ReferenceOption | null
  options: ReferenceOption[]
  onChange: (value: string) => void
  placeholder: string
  tableLabel: string
  disabled?: boolean
  maxResults?: number
  messages: ReferenceComboboxMessages
}

const defaultMaxResults = 50

export function ReferenceCombobox({
  id,
  className,
  value,
  selectedOption,
  options,
  onChange,
  placeholder,
  tableLabel,
  disabled,
  maxResults = defaultMaxResults,
  messages,
}: ReferenceComboboxProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const normalizedQuery = searchTerm.trim().toLowerCase()

  const effectiveSelectedOption = useMemo(() => {
    if (selectedOption) {
      return selectedOption
    }
    if (!value) {
      return null
    }
    return options.find((option) => option.value === value) ?? null
  }, [options, selectedOption, value])

  const { displayedOptions, matchCount, hasMoreResults } = useMemo(() => {
    const matches = normalizedQuery
      ? options.filter((option) => {
          const haystack = option.searchText ?? `${option.label} ${option.description ?? ''}`
          return haystack.toLowerCase().includes(normalizedQuery)
        })
      : options

    return {
      displayedOptions: matches.slice(0, maxResults),
      matchCount: matches.length,
      hasMoreResults: matches.length > maxResults,
    }
  }, [maxResults, normalizedQuery, options])

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      setSearchTerm('')
    }
  }

  const emptyLabel = normalizedQuery
    ? messages.noResultsForQuery(searchTerm)
    : messages.noResults

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-between font-normal"
          >
            {effectiveSelectedOption ? (
              <span className="mr-2 flex-1 truncate text-left">{effectiveSelectedOption.label}</span>
            ) : (
              <span className="mr-2 flex-1 truncate text-left text-muted-foreground">
                {placeholder}
              </span>
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[--radix-popover-trigger-width] p-0">
          <Command shouldFilter={false}>
            <CommandInput
              value={searchTerm}
              onValueChange={setSearchTerm}
              placeholder={messages.searchPlaceholder}
            />
            <CommandList>
              <CommandEmpty>{emptyLabel}</CommandEmpty>
              <CommandGroup heading={tableLabel}>
                {displayedOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => {
                      onChange(option.value)
                      handleOpenChange(false)
                    }}
                  >
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-medium">{option.label}</span>
                      {option.description ? (
                        <span className="text-xs text-muted-foreground">{option.description}</span>
                      ) : null}
                    </div>
                    <Check
                      className={cn(
                        'ml-auto h-4 w-4',
                        effectiveSelectedOption?.value === option.value ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
          {hasMoreResults ? (
            <p className="px-3 py-2 text-xs text-muted-foreground border-t">
              {messages.resultsLimited(maxResults, matchCount)}
            </p>
          ) : null}
        </PopoverContent>
      </Popover>
    </div>
  )
}
