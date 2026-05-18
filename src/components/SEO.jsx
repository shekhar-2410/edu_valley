import { Helmet } from 'react-helmet-async'
import { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from '../config/seo'

const SEO = ({ title, description, path = '/', image, type = 'website' }) => {
    const fullUrl = `${SITE_URL}${path}`
    const ogImage = image || DEFAULT_OG_IMAGE

    return (
        <Helmet>
            <title>{title}</title>
            <meta name="description" content={description} />
            <link rel="canonical" href={fullUrl} />

            <meta property="og:type" content={type} />
            <meta property="og:site_name" content={SITE_NAME} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:url" content={fullUrl} />
            <meta property="og:image" content={ogImage} />

            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={ogImage} />
        </Helmet>
    )
}

export default SEO
