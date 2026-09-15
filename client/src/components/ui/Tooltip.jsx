import { useState } from 'react'

export function Tooltip({ children, content, side = 'top' }) {
  const [show, setShow] = useState(false)

  const sideClasses = {
    top: 'bottom-full mb-2 -translate-x-1/2 left-1/2',
    bottom: 'top-full mt-2 -translate-x-1/2 left-1/2',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 -translate-y-1/2',
  }

  return (
    <div className="relative inline-block"
         onMouseEnter={() => setShow(true)}
         onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div className={`absolute whitespace-nowrap z-50 ${sideClasses[side]}`}>
          <div className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium px-2 py-1 rounded-md shadow-lg">
            {content}
          </div>
        </div>
      )}
    </div>
  )
}
