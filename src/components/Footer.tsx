
import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Mail, Phone, MapPin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-tech-gray dark:bg-gray-900 text-white transition-colors duration-300">
      <div className="container-padding max-w-7xl mx-auto py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Column 1 */}
          <div>
            <h3 className="text-xl font-bold mb-6">Compusistemas de Chiapas S.A. de C.V.</h3>
            <p className="text-gray-300 mb-6">
              Expertos en tecnología con más de 30 años de experiencia brindando soluciones informáticas y de calidad.
            </p>
            <div className="flex space-x-4">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white hover:text-tech-blue transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white hover:text-tech-blue transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
            </div>
          </div>
          
          {/* Column 2 */}
          <div>
            <h3 className="text-xl font-bold mb-6">Servicios</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/servicios" className="text-gray-300 hover:text-white transition-colors">
                  Reparación de Computadoras
                </Link>
              </li>
              <li>
                <Link to="/servicios" className="text-gray-300 hover:text-white transition-colors">
                  Mantenimiento Preventivo
                </Link>
              </li>
              <li>
                <Link to="/servicios" className="text-gray-300 hover:text-white transition-colors">
                  Recuperación de Datos
                </Link>
              </li>
              <li>
                <Link to="/servicios" className="text-gray-300 hover:text-white transition-colors">
                  Configuración de Redes
                </Link>
              </li>
              <li>
                <Link to="/servicios" className="text-gray-300 hover:text-white transition-colors">
                  Soporte Técnico Empresarial
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Column 3 */}
          <div>
            <h3 className="text-xl font-bold mb-6">Productos</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/productos" className="text-gray-300 hover:text-white transition-colors">
                  Laptops
                </Link>
              </li>
              <li>
                <Link to="/productos" className="text-gray-300 hover:text-white transition-colors">
                  Computadoras de Escritorio
                </Link>
              </li>
              <li>
                <Link to="/productos" className="text-gray-300 hover:text-white transition-colors">
                  Accesorios
                </Link>
              </li>
              <li>
                <Link to="/productos" className="text-gray-300 hover:text-white transition-colors">
                  Impresoras
                </Link>
              </li>
              <li>
                <Link to="/productos" className="text-gray-300 hover:text-white transition-colors">
                  Redes y Conectividad
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Column 4 */}
          <div>
            <h3 className="text-xl font-bold mb-6">Contacto</h3>
            <ul className="space-y-4">
              <li className="flex items-start">
                <MapPin size={20} className="mr-3 text-tech-blue mt-1" />
                <span className="text-gray-300">
                  <a 
                    href="https://maps.app.goo.gl/jp9mgSQvwcNeHM1U9" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="hover:text-white transition-colors"
                  >
                    6a. Avenida Sur, 12, Centro, 30700. Tapachula de Córdova y Ordoñez, Chis.
                  </a>
                </span>
              </li>
              <li className="flex items-center">
                <Phone size={20} className="mr-3 text-tech-blue" />
                <a href="tel:+529622148546" className="text-gray-300 hover:text-white transition-colors">
                  +52 (962) 214-8546
                </a>
              </li>
              <li className="flex items-center">
                <Mail size={20} className="mr-3 text-tech-blue" />
                <a href="mailto:info@compuchiapas.com" className="text-gray-300 hover:text-white transition-colors">
                  info@compuchiapas.com
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-12 pt-8 text-center text-gray-400">
          <p>© 2026 Compusistemas de Chiapas. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
