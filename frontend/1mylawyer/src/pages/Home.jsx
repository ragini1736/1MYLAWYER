import React from 'react'

import Hero from "../components/Hero";
import AboutAdvocate from './AboutAdvocate';
import Service from "./Service";
import Advocate from "../components/Advoacate";
import Statistics from '../components/Statistics';
import Testimonials from '../components/Testimonials';
import FAQ from "../components/FAQ";
import LegalLibrary from './LegalLibrary';


function Home(){
    return (
        <>
        
        <Hero />
        <AboutAdvocate />
        <Service />
        <Statistics />
        <Testimonials />
        <FAQ />
        <Advocate />
        <LegalLibrary />
        
        </>
    );
}

export default Home;