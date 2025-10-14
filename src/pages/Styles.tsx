import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import modernFarmhouse from "@/assets/style-modern-farmhouse.jpg";
import coastal from "@/assets/style-coastal.jpg";
import scandinavian from "@/assets/style-scandinavian.jpg";
import contemporary from "@/assets/style-contemporary.jpg";
import midCentury from "@/assets/style-mid-century.jpg";
import mountainRustic from "@/assets/style-mountain-rustic.jpg";
import transitional from "@/assets/style-transitional.jpg";
import japandi from "@/assets/style-japandi.jpg";

const styles = [
  {
    name: "Modern Farmhouse",
    image: modernFarmhouse,
    description: "Blending rustic charm with modern comfort, this style features neutral color palettes, natural wood accents, shiplap details, and cozy textiles.",
  },
  {
    name: "Coastal",
    image: coastal,
    description: "Inspired by beachside living, coastal style brings light and airy vibes with soft blues, sandy neutrals, natural textures like rattan and jute.",
  },
  {
    name: "Scandinavian",
    image: scandinavian,
    description: "Emphasizing simplicity and functionality, Scandinavian design features clean lines, minimal clutter, light wood tones, and a neutral color scheme.",
  },
  {
    name: "Contemporary",
    image: contemporary,
    description: "Sleek and sophisticated, contemporary style showcases clean lines, neutral tones with bold accents, modern furniture, and minimal ornamentation.",
  },
  {
    name: "Mid-Century Modern",
    image: midCentury,
    description: "Characterized by iconic furniture pieces, organic shapes, and a mix of materials like wood and metal. Features clean lines and functionality.",
  },
  {
    name: "Mountain Rustic",
    image: mountainRustic,
    description: "Embracing natural materials like wood and stone, this style creates a cozy lodge-like atmosphere with warm earth tones and rustic textures.",
  },
  {
    name: "Transitional",
    image: transitional,
    description: "Perfectly balanced between traditional and contemporary, transitional style combines classic furniture silhouettes with modern finishes.",
  },
  {
    name: "Japandi",
    image: japandi,
    description: "A harmonious fusion of Japanese minimalism and Scandinavian functionality, featuring clean lines, natural materials, and neutral tones.",
  },
];

const Styles = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Our Staging <span className="text-primary">Styles</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Choose from our curated collection of professional staging styles designed to
            showcase your property's full potential and attract the right buyers
          </p>
        </section>

        {/* Styles Grid */}
        <section className="container mx-auto px-4 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {styles.map((style, index) => (
              <div
                key={index}
                className="group rounded-lg overflow-hidden bg-card border border-border transition-all hover:shadow-lg"
              >
                <div className="aspect-video overflow-hidden">
                  <img
                    src={style.image}
                    alt={`${style.name} staging style example`}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-3">{style.name}</h3>
                  <p className="text-muted-foreground">{style.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-muted/50 py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Property?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Select your preferred style during the upload process and watch your empty rooms
              come to life with professional staging
            </p>
            <Link to="/upload">
              <Button size="lg" className="text-lg px-8">
                Place Staging Order
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Styles;
