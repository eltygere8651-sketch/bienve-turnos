
import React from 'react';

// FIX: Updated component to accept all standard SVG props and render a <title> element for accessibility.
// FIX: Add 'title' to props type
export const LogoIcon: React.FC<React.SVGProps<SVGSVGElement> & { title?: string }> = ({ className, title, ...props }) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className || "w-8 h-8"} {...props}>
        {title && <title>{title}</title>}
        <defs>
            <linearGradient id="paint0_linear_1_2" x1="6" y1="3" x2="20" y2="20" gradientUnits="userSpaceOnUse">
                <stop stopColor="#DC2626"/>
                <stop offset="1" stopColor="#991B1B"/>
            </linearGradient>
        </defs>
        {/* The B Letter */}
        <path d="M13.5 11.5C15.7091 11.5 17.5 9.70914 17.5 7.5C17.5 5.29086 15.7091 3.5 13.5 3.5H8.5V11.5H13.5Z" fill="url(#paint0_linear_1_2)"/>
        <path d="M14.5 18.5C17.2614 18.5 19.5 16.2614 19.5 13.5C19.5 10.7386 17.2614 8.5 14.5 8.5H8.5V18.5H14.5Z" fill="url(#paint0_linear_1_2)"/>
        {/* The Tray */}
        <path d="M4 20.5C4 19.9477 4.44772 19.5 5 19.5H19C19.5523 19.5 20 19.9477 20 20.5V20.5C20 21.0523 19.5523 21.5 19 21.5H5C4.44772 21.5 4 21.0523 4 20.5V20.5Z" fill="#B91C1C"/>
        {/* Waiter Silhouette */}
        <path d="M13.5,11c-0.55,0-1,0.45-1,1s0.45,1,1,1s1-0.45,1-1S14.05,11,13.5,11z M12,17.5v-4h3v4H12z M15,14.8h2.5v0.5H15v-0.5z" fill="black"/>
    </svg>
);

// FIX: Updated component to accept all standard SVG props and render a <title> element for accessibility.
// FIX: Add 'title' to props type
export const GoogleDriveIcon: React.FC<React.SVGProps<SVGSVGElement> & { title?: string }> = ({ className, title, ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "w-6 h-6"} viewBox="0 0 24 24" fill="currentColor" {...props}>
        {title && <title>{title}</title>}
        <path d="M20.35,3.65l-6.36-6.36C13.82-2.89,13.41-3,13-3H6C4.9-3,4, -2.1,4,-1v26c0,1.1,0.9,2,2,2h12c1.1,0,2-0.9,2-2V4C20,3.59,20.11,3.18,20.35,3.65z M13,4.5V10h5.5L13,4.5z" fill="#4285F4"/>
        <path d="M19.71,9.29l-4-4C15.53,5.11,15.28,5,15,5H9C7.9,5,7,5.9,7,7v10c0,1.1,0.9,2,2,2h6c1.1,0,2-0.9,2-2V10C17,9.72,16.89,9.47,16.71,9.29z" fill="#1E88E5"/>
        <path d="M19.71,9.29l-4-4C15.53,5.11,15.28,5,15,5H9C7.9,5,7,5.9,7,7v10c0,1.1,0.9,2,2,2h6c1.1,0,2-0.9,2-2V10C17,9.72,16.89,9.47,16.71,9.29z" fill-opacity="0.1"/>
        <path d="M15,5v4c0,0.55,0.45,1,1,1h4L15,5z" fill="#FFC107"/>
        <path d="M9,19h6c0.55,0,1-0.45,1-1v-4c0-0.55-0.45-1-1-1H9c-0.55,0-1,0.45-1,1v4C8,18.55,8.45,19,9,19z" fill="#4CAF50"/>
    </svg>
);

// FIX: Updated component to accept all standard SVG props and render a <title> element for accessibility.
// FIX: Add 'title' to props type
export const DownloadIcon: React.FC<React.SVGProps<SVGSVGElement> & { title?: string }> = ({ className, title, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...props}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);

// FIX: Updated component to accept all standard SVG props and render a <title> element for accessibility.
// FIX: Add 'title' to props type
export const CalendarDownloadIcon: React.FC<React.SVGProps<SVGSVGElement> & { title?: string }> = ({ className, title, ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...props}>
        {title && <title>{title}</title>}
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18M-4.5 12h22.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.75v-3.75m0 0V9m0 2.25l-2.25-2.25M12 12l2.25-2.25" />
    </svg>
);

// FIX: Updated component to accept all standard SVG props and render a <title> element for accessibility.
// FIX: Add 'title' to props type
export const ChevronLeftIcon: React.FC<React.SVGProps<SVGSVGElement> & { title?: string }> = ({ className, title, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...props}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

// FIX: Updated component to accept all standard SVG props and render a <title> element for accessibility.
// FIX: Add 'title' to props type
export const ChevronRightIcon: React.FC<React.SVGProps<SVGSVGElement> & { title?: string }> = ({ className, title, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...props}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

// FIX: Updated component to accept all standard SVG props and render a <title> element for accessibility.
// FIX: Add 'title' to props type
export const CalendarIcon: React.FC<React.SVGProps<SVGSVGElement> & { title?: string }> = ({ className, title, ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...props}>
        {title && <title>{title}</title>}
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18M-4.5 12h22.5" />
    </svg>
);

// FIX: Updated component to accept all standard SVG props and render a <title> element for accessibility.
// FIX: Add 'title' to props type
export const SunIcon: React.FC<React.SVGProps<SVGSVGElement> & { title?: string }> = ({ className, title, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...props}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
  </svg>
);

// FIX: Updated component to accept all standard SVG props and render a <title> element for accessibility.
// FIX: Add 'title' to props type
export const StarIcon: React.FC<React.SVGProps<SVGSVGElement> & { title?: string }> = ({ className, title, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...props}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.32 1.011l-4.218 3.87a.563.563 0 00-.162.521l1.257 5.273c.099.418-.36.79-.746.592L12 18.225a.563.563 0 00-.53 0l-4.945 2.926c-.386.228-.845-.174-.746-.592l1.257-5.273a.563.563 0 00-.162-.521l-4.218-3.87c-.38-.348-.179-.971.32-1.011l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
  </svg>
);

// FIX: Updated component to accept all standard SVG props and render a <title> element for accessibility.
// FIX: Add 'title' to props type
export const ArrowPathIcon: React.FC<React.SVGProps<SVGSVGElement> & { title?: string }> = ({ className, title, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...props}>
    {title && <title>{title}</title>}
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0l3.181-3.183m-4.991-2.696L7.985 5.644m0 0L4.804 8.825m3.181-3.181l11.664 11.664" />
  </svg>
);

// FIX: Updated component to accept all standard SVG props and render a <title> element for accessibility.
// FIX: Add 'title' to props type
export const CheckCircleIcon: React.FC<React.SVGProps<SVGSVGElement> & { title?: string }> = ({ className, title, ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...props}>
        {title && <title>{title}</title>}
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

// FIX: Updated component to accept all standard SVG props and render a <title> element for accessibility.
// FIX: Add 'title' to props type
export const ExclamationCircleIcon: React.FC<React.SVGProps<SVGSVGElement> & { title?: string }> = ({ className, title, ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...props}>
        {title && <title>{title}</title>}
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
    </svg>
);

// FIX: Updated component to accept all standard SVG props and render a <title> element for accessibility.
// FIX: Add 'title' to props type
export const Cog6ToothIcon: React.FC<React.SVGProps<SVGSVGElement> & { title?: string }> = ({ className, title, ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...props}>
        {title && <title>{title}</title>}
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.438.995s.145.755.438.995l1.003.827c.424.35.534.954.26 1.431l-1.296 2.247a1.125 1.125 0 01-1.37.49l-1.217-.456c-.355-.133-.75-.072-1.075.124a6.57 6.57 0 01-.22.127c-.332.183-.582.495-.645.87l-.213 1.281c-.09.543-.56.94-1.11.94h-2.593c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.063-.374-.313-.686-.645-.87a6.52 6.52 0 01-.22-.127c-.324-.196-.72-.257-1.075-.124l-1.217.456a1.125 1.125 0 01-1.37-.49l-1.296-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.437-.995s-.145-.755-.437-.995l-1.004-.827a1.125 1.125 0 01-.26-1.431l1.296-2.247a1.125 1.125 0 011.37-.49l1.217.456c.355.133.75.072 1.075-.124.073-.044.146-.087.22-.127.332-.183.582-.495.645-.87l.213-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

// FIX: Updated component to accept all standard SVG props and render a <title> element for accessibility.
// FIX: Add 'title' to props type
export const TrashIcon: React.FC<React.SVGProps<SVGSVGElement> & { title?: string }> = ({ className, title, ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"} {...props}>
        {title && <title>{title}</title>}
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.134H8.09c-1.18 0-2.09.954-2.09 2.134v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
);
