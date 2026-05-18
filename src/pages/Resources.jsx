import { BookOpen, ExternalLink, Globe, Laptop, Video } from 'lucide-react'
import SEO from '../components/SEO'
import { PAGE_META } from '../config/seo'

const Resources = () => {
    const resources = [
        {
            category: 'General Learning',
            icon: <BookOpen size={32} />,
            items: [
                { name: 'Khan Academy', url: 'https://www.khanacademy.org/', description: 'Free courses in math, science, and humanities' },
                { name: 'Coursera', url: 'https://www.coursera.org/', description: 'Online courses from top universities' },
                { name: 'edX', url: 'https://www.edx.org/', description: 'University-level courses in various subjects' },
                { name: 'Academic Earth', url: 'https://academicearth.org/', description: 'Free online college courses' },
            ]
        },
        {
            category: 'Mathematics',
            icon: <Laptop size={32} />,
            items: [
                { name: 'Brilliant', url: 'https://brilliant.org/', description: 'Learn math and science through problem-solving' },
                { name: 'Math is Fun', url: 'https://www.mathsisfun.com/', description: 'Simple, fun math lessons' },
                { name: 'Wolfram Alpha', url: 'https://www.wolframalpha.com/', description: 'Computational knowledge engine' },
                { name: 'GeoGebra', url: 'https://www.geogebra.org/', description: 'Free math tools and calculators' },
            ]
        },
        {
            category: 'Science',
            icon: <Globe size={32} />,
            items: [
                { name: 'NASA STEM', url: 'https://www.nasa.gov/stem/', description: 'Space and science education resources' },
                { name: 'PhET Simulations', url: 'https://phet.colorado.edu/', description: 'Interactive science simulations' },
                { name: 'National Geographic Kids', url: 'https://kids.nationalgeographic.com/', description: 'Science and nature for kids' },
                { name: 'Science Buddies', url: 'https://www.sciencebuddies.org/', description: 'Science project ideas and resources' },
            ]
        },
        {
            category: 'Languages',
            icon: <Globe size={32} />,
            items: [
                { name: 'Duolingo', url: 'https://www.duolingo.com/', description: 'Learn languages for free' },
                { name: 'BBC Languages', url: 'http://www.bbc.co.uk/languages/', description: 'Language learning courses' },
                { name: 'English Grammar 101', url: 'https://www.englishgrammar101.com/', description: 'Free English grammar lessons' },
            ]
        },
        {
            category: 'Video Learning',
            icon: <Video size={32} />,
            items: [
                { name: 'YouTube Education', url: 'https://www.youtube.com/education', description: 'Educational videos on every subject' },
                { name: 'TED-Ed', url: 'https://ed.ted.com/', description: 'Educational videos and lessons' },
                { name: 'CrashCourse', url: 'https://www.youtube.com/@crashcourse', description: 'Entertaining educational videos' },
                { name: 'India Reads Aloud', url: 'https://www.youtube.com/@IndiaReadsAloud', description: 'Enriching stories and learning for students' },
                { name: 'National Geographic', url: 'https://www.youtube.com/@NatGeo', description: 'Science and nature documentaries' },
                { name: 'Food Pharmer Kids', url: 'https://www.youtube.com/channel/UC6g9AdbYMDWCSkPAm3VDIpw', description: 'Health education for kids by @foodpharmer' },
            ]
        },
        {
            category: 'Coding & Technology',
            icon: <Laptop size={32} />,
            items: [
                { name: 'Scratch', url: 'https://scratch.mit.edu/', description: 'Learn to code through creative projects' },
                { name: 'Code.org', url: 'https://code.org/', description: 'Free coding courses for all ages' },
                { name: 'W3Schools', url: 'https://www.w3schools.com/', description: 'Web development tutorials' },
                { name: 'freeCodeCamp', url: 'https://www.freecodecamp.org/', description: 'Learn to code for free' },
            ]
        }
    ]

    return (
        <>
            <SEO {...PAGE_META.resources} />
            <div className="bg-white min-h-screen">
            {/* Header Section */}
            <section className="relative pt-24 pb-20 lg:pt-40 lg:pb-32 overflow-hidden bg-brand-navy-900 text-white">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center opacity-10"></div>
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <span className="inline-block px-4 py-2 rounded-full bg-brand-gold-500/20 border border-brand-gold-400/30 text-brand-gold-300 text-sm font-bold tracking-widest uppercase backdrop-blur-sm mb-6">Learning Hub</span>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-8 leading-[1.1] tracking-tight">
                        Free <span className="text-brand-gold-400">Resources.</span>
                    </h1>
                    <p className="text-lg md:text-xl text-brand-navy-200 max-w-3xl mx-auto font-medium leading-relaxed">Enhance your learning with these curated online educational tools and platforms.</p>
                </div>
            </section>

            <section className="py-20 lg:py-32">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto text-center mb-20">
                        <p className="text-xl text-brand-navy-500 leading-relaxed font-medium">
                            At Narendra Edu Valley, we believe in continuous learning beyond the classroom.
                            Explore these free online educational resources to help students explore,
                            learn, and excel in various subjects at their own pace.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {resources.map((category, index) => (
                            <div key={index} className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-brand-navy-100/50 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group">
                                <div className="flex items-center gap-6 mb-8">
                                    <div className="w-16 h-16 bg-brand-navy-50 rounded-2xl flex items-center justify-center text-brand-navy-600 group-hover:bg-brand-navy-600 group-hover:text-white transition-colors duration-500">
                                        {category.icon}
                                    </div>
                                    <h2 className="text-3xl font-black text-brand-navy-800">{category.category}</h2>
                                </div>
                                <div className="space-y-4">
                                    {category.items.map((item, idx) => (
                                        <a
                                            key={idx}
                                            href={item.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-between p-5 rounded-2xl bg-brand-cream hover:bg-brand-navy-50 transition-colors group/item"
                                        >
                                            <div>
                                                <h3 className="text-xl font-bold text-brand-navy-800 group-hover/item:text-brand-crimson-600">{item.name}</h3>
                                                <p className="text-sm text-brand-navy-400 line-clamp-1">{item.description}</p>
                                            </div>
                                            <ExternalLink size={18} className="text-brand-navy-200 group-hover/item:text-brand-crimson-600 group-hover/item:translate-x-1 group-hover/item:-translate-y-1 transition-all" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-24 p-12 bg-brand-gold-50 rounded-[3rem] text-center border border-brand-gold-100">
                        <h3 className="text-2xl font-black text-brand-navy-900 mb-4 uppercase tracking-tighter">Important Note</h3>
                        <p className="text-lg text-brand-navy-500 max-w-3xl mx-auto leading-relaxed">
                            These resources are provided for educational purposes. While we've carefully selected these platforms,
                            we encourage students and parents to review each resource to ensure it meets their specific learning needs.
                        </p>
                    </div>
                </div>
            </section>
            </div>
        </>
    )
}

export default Resources
