// const Tools = () => {
//   return (
//     <div>
//       <h1>Tools</h1>
//     </div>
//   );
// };

// export default Tools;

import React from "react";

function Tools() {
  return (
    <div className="container mx-auto px-4 py-16">
      {/* Hero section */}
      <section className="flex flex-col md:flex-row items-center justify-between">
        <div className="text-center md:text-left w-full md:w-1/2">
          <h1 className="text-4xl font-bold mb-4">
            V-Text: Advanced Annotation Tool for Vietnam-Related Research
          </h1>
          <p className="text-lg leading-loose">
            V-Text is a cutting-edge annotation tool designed specifically for
            independent research groups focusing on Vietnam-related texts,
            images, and videos. It offers a comprehensive suite of features
            tailored to the unique needs of scholars and researchers working in
            the fields of Vietnam studies.
          </p>
          <button className="font-bold py-2 px-4 rounded-full mt-4">
            Try V-text
          </button>
        </div>
        <div className="w-full md:w-1/2 flex justify-center">
          {/* Add an image here using img tag with appropriate src and alt  */}
        </div>
      </section>

      {/* Key Features section */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-16">
        <div className="flex flex-col items-center p-4 border rounded-lg shadow-md">
          <h3 className="text-primary-blue text-2xl font-bold mb-2">
            Multimedia Annotation
          </h3>
          <p className="text-center md:text-left">
            V-Text supports a wide range of formats, allowing users to annotate
            text documents, images, and videos seamlessly.
          </p>
        </div>
        <div className="flex flex-col items-center p-4 border rounded-lg shadow-md">
          <h3 className="text-primary-blue text-2xl font-bold mb-2">
            Language-Specific Tools
          </h3>
          <p className="text-center md:text-left">
            With robust support for the Vietnamese language, including special
            characters and diacritics, V-Text ensures accurate and efficient
            annotation of Vietnamese texts.
          </p>
        </div>
        <div className="flex flex-col items-center p-4 border rounded-lg shadow-md">
          <h3 className="text-primary-blue text-2xl font-bold mb-2">
            Collaborative Environment
          </h3>
          <p className="text-center md:text-left">
            V-Text fosters collaboration by enabling multiple users to work on
            the same project simultaneously. Real-time updates and version
            control ensure that all contributions are synchronized and
            documented.
          </p>
        </div>
        <div className="flex flex-col items-center p-4 border rounded-lg shadow-md">
          <h3 className="text-primary-blue text-2xl font-bold mb-2">
            Customizable Annotations
          </h3>
          <p className="text-center md:text-left">
            Researchers can create and manage custom tags, comments, and
            metadata, allowing for detailed and organized annotation tailored to
            specific research needs.
          </p>
        </div>
      </section>
    </div>
  );
}

export default Tools;
