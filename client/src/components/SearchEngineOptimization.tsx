import { Helmet } from 'react-helmet'

interface SeoProps {
  title?: string
  description?: string
}

export function SearchEngineOptimization({ title, description }: SeoProps) {
  const pageTitle = title ? `${title} | AQC-RPN` : 'AQC-RPN'
  const pageDescription =
    description || 'Plateforme web de solidarit\u00e9 ACQ-RPN'

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
    </Helmet>
  )
}
