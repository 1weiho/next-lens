import type { SVGProps } from 'react'
import { Typescript } from './ui/svgs/typescript'
import { Javascript } from './ui/svgs/javascript'
import { ReactDark } from './ui/svgs/reactDark'
import { ReactLight } from './ui/svgs/reactLight'

interface FileIconProps extends SVGProps<SVGSVGElement> {
  fileName: string
  className?: string
}

export function FileIcon({ fileName, className, ...props }: FileIconProps) {
  const extension = fileName.split('.').pop()?.toLowerCase()

  const iconClassName = `h-3.5 w-3.5 shrink-0 ${className || ''}`

  switch (extension) {
    case 'tsx':
      return (
        <>
          <ReactDark className={`${iconClassName} dark:hidden`} {...props} />
          <ReactLight
            className={`${iconClassName} hidden dark:block`}
            {...props}
          />
        </>
      )
    case 'jsx':
      return (
        <>
          <ReactDark className={`${iconClassName} dark:hidden`} {...props} />
          <ReactLight
            className={`${iconClassName} hidden dark:block`}
            {...props}
          />
        </>
      )
    case 'ts':
      return <Typescript className={iconClassName} {...props} />
    case 'js':
      return <Javascript className={iconClassName} {...props} />
    default:
      return null
  }
}
