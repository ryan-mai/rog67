import { useRef } from "react";
import About from "./components/About";
import Hero from "./components/Hero";
import NavBar from "./components/Navbar";
import Features from "./components/Features";
import Story from "./components/Story";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import SelectionTTS from "./components/SelectionTTS";
import ChatbotWidget from "./components/ChatbotWidget";

function App() {
  const contentRef = useRef(null);

  return (
    <main className="relative min-h-screen w-screen overflow-x-hidden">
      <div ref={contentRef}>
        <NavBar />
        <Hero />
        <About />
        <Features />
        <Story />
        <Contact />
        <Footer />
      </div>
      <SelectionTTS />
      <ChatbotWidget contentRef={contentRef} />
    </main>
  );
}

export default App;
