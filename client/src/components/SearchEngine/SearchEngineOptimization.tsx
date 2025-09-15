import { Helmet } from 'react-helmet-async'

interface SearchEngineOptimizationProps {
  title?: string
  description?: string
}

export function SearchEngineOptimization({ title, description }: SearchEngineOptimizationProps) {
  const pageTitle = title ? `${title} | AQC-RPN` : 'AQC-RPN'
  const pageDescription =
    description || 'Association des Camerounais et Camerounaises du Québec'

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
    </Helmet>
  )
}