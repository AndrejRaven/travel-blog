// Wszystkie zapytania GROQ w jednym miejscu
export const QUERIES = {
  // Zapytania dla postów
  POST: {
    // Pobierz post po slug
    BY_SLUG: `*[_type == "post" && slug.current == $slug][0]{
      _id,
      title,
      subtitle,
      description,
      slug,
      publishedAt,
      categories[]-> {
        _id,
        name,
        slug {
          current
        },
        color,
        icon {
          asset-> {
            _id,
            url,
            metadata {
              dimensions {
                width,
                height
              }
            }
          },
          hotspot,
          crop,
          alt
        },
        mainCategory-> {
          _id,
          name,
          slug {
            current
          },
          superCategory-> {
            _id,
            name,
            slug {
              current
            }
          }
        }
      },
      coverImage {
        asset-> {
          _id,
          url,
          metadata {
            dimensions {
              width,
              height
            }
          }
        },
        hotspot,
        crop
      },
      coverMobileImage {
        asset-> {
          _id,
          url,
          metadata {
            dimensions {
              width,
              height
            }
          }
        },
        hotspot,
        crop
      },
      seo {
        seoTitle,
        seoDescription,
        seoKeywords,
        canonicalUrl,
        noIndex,
        noFollow,
        ogTitle,
        ogDescription,
        ogImage {
          asset-> {
            _id,
            url,
            metadata {
              dimensions {
                width,
                height
              }
            }
          },
          hotspot,
          crop
        }
      },
      components[] {
        _type,
        _key,
        ...,
        container {
          ...,
          "contentTitle": @.contentTitle
        },
        content[] {
          ...,
          children[] {
            ...,
            marks[],
            markDefs[] {
              ...,
              _type == "link" => {
                ...,
                "href": @.href,
                "blank": @.blank
              },
              _type == "customStyle" => {
                ...,
                "style": @.style
              }
            }
          }
        },
        image {
          asset-> {
            _id,
            url,
            metadata {
              dimensions {
                width,
                height
              }
            }
          },
          hotspot,
          crop
        },
        mobileImage {
          asset-> {
            _id,
            url,
            metadata {
              dimensions {
                width,
                height
              }
            }
          },
          hotspot,
          crop
        },
        images[] {
          asset-> {
            _id,
            url,
            metadata {
              dimensions {
                width,
                height
              }
            }
          },
          hotspot,
          crop,
          alt
        },
        buttons[] {
          ...,
          _type == "button" => {
            ...,
            "label": @.label,
            "href": @.href,
            "variant": @.variant,
            "external": @.external
          }
        },
        // Specjalne pola dla backgroundHeroBanner
        mobileContent[] {
          ...,
          children[] {
            ...,
            marks[],
            markDefs[] {
              ...,
              _type == "link" => {
                ...,
                "href": @.href,
                "blank": @.blank
              },
              _type == "customStyle" => {
                ...,
                "style": @.style
              }
            }
          }
        }
      }
    }`,

    // Pobierz wszystkie slugi postów
    ALL_SLUGS: `*[_type == "post" && defined(slug.current)][].slug.current`,

    // Pobierz najnowsze posty (zoptymalizowane z indeksem)
    LATEST: `*[_type == "post" && defined(publishedAt)] | order(publishedAt desc, _createdAt desc) [0...$limit] {
      _id,
      title,
      subtitle,
      description,
      slug,
      publishedAt,
      coverImage {
        asset-> {
          _id,
          url,
          metadata {
            dimensions {
              width,
              height
            }
          }
        },
        hotspot,
        crop,
        alt
      },
      coverMobileImage {
        asset-> {
          _id,
          url,
          metadata {
            dimensions {
              width,
              height
            }
          }
        },
        hotspot,
        crop,
        alt
      },
      categories[]-> {
        _id,
        name,
        slug {
          current
        },
        color,
        icon {
          asset-> {
            _id,
            url,
            metadata {
              dimensions {
                width,
                height
              }
            }
          },
          hotspot,
          crop,
          alt
        },
        mainCategory-> {
          _id,
          name,
          slug {
            current
          },
          superCategory-> {
            _id,
            name,
            slug {
              current
            }
          }
        }
      }
    }`,

    // Pobierz wybrane posty po ID
    SELECTED: `*[_type == "post" && _id in $articleIds] {
      _id,
      title,
      subtitle,
      description,
      slug,
      publishedAt,
      coverImage {
        asset-> {
          _id,
          url,
          metadata {
            dimensions {
              width,
              height
            }
          }
        },
        hotspot,
        crop,
        alt
      },
      coverMobileImage {
        asset-> {
          _id,
          url,
          metadata {
            dimensions {
              width,
              height
            }
          }
        },
        hotspot,
        crop,
        alt
      },
      categories[]-> {
        _id,
        name,
        slug {
          current
        },
        color,
        icon {
          asset-> {
            _id,
            url,
            metadata {
              dimensions {
                width,
                height
              }
            }
          },
          hotspot,
          crop,
          alt
        },
        mainCategory-> {
          _id,
          name,
          slug {
            current
          },
          superCategory-> {
            _id,
            name,
            slug {
              current
            }
          }
        }
      }
    }`
  },

  // Zapytania dla headera
  HEADER: {
    // Pobierz dane headera
    DATA: `*[_type == "header"][0] {
      _id,
      title,
      logo {
        asset->{
          _id,
          url
        }
      },
      mainMenu[] {
        label,
        href,
        isExternal,
        hasDropdown,
        dropdownItems[] {
          label,
          href,
          isExternal,
          hasSubmenu,
          submenuItems[] {
            label,
            href,
            isExternal
          }
        }
      },
      categoriesDropdown {
        label,
        sections[] {
          key,
          title,
          emoji,
          items[] {
            label,
            href,
            isExternal
          }
        }
      },
      mobileMenu {
        isEnabled,
        label
      }
    }`
  },

  // Zapytania dla komponentu articles
  ARTICLES: {
    // Pobierz dane komponentu articles
    COMPONENT_DATA: `*[_type == "articles"][0] {
      _id,
      _type,
      container {
        maxWidth,
        padding,
        margin {
          top,
          bottom
        },
        backgroundColor,
        borderRadius,
        shadow,
        height,
        contentTitle
      },
      title,
      showViewAll,
      viewAllHref,
      articlesType,
      selectedArticles[] {
        _ref
      },
      maxArticles
    }`
  },

  // Zapytania dla kategorii nadrzędnych
  SUPER_CATEGORY: {
    // Pobierz wszystkie kategorie nadrzędne
    ALL: `*[_type == "superCategory" && isActive == true] | order(name asc) {
      _id,
      name,
      slug {
        current
      },
      color,
      description,
      icon {
        asset-> {
          _id,
          url,
          metadata {
            dimensions {
              width,
              height
            }
          }
        },
        hotspot,
        crop
      },
      invertOnDark
    }`,

    // Pobierz kategorię nadrzędną po slug
    BY_SLUG: `*[_type == "superCategory" && slug.current == $slug][0] {
      _id,
      name,
      slug {
        current
      },
      color,
      description,
      icon {
        asset-> {
          _id,
          url,
          metadata {
            dimensions {
              width,
              height
            }
          }
        },
        hotspot,
        crop
      },
      invertOnDark
    }`,

    // Pobierz kategorie główne dla kategorii nadrzędnej
    MAIN_CATEGORIES: `*[_type == "mainCategory" && superCategory->slug.current == $superCategorySlug && isActive == true] | order(name asc) {
      _id,
      name,
      slug {
        current
      },
      color,
      description,
      icon {
        asset-> {
          _id,
          url,
          metadata {
            dimensions {
              width,
              height
            }
          }
        },
        hotspot,
        crop
      },
      invertOnDark,
      superCategory-> {
        _id,
        name,
        slug {
          current
        }
      }
    }`,

    // Pobierz posty z kategorii nadrzędnej (wszystkie podkategorie)
    POSTS: `*[_type == "post" && defined(publishedAt) && $superCategorySlug in categories[]->mainCategory->superCategory->slug.current] | order(publishedAt desc, _createdAt desc) {
      _id,
      title,
      subtitle,
      description,
      slug,
      publishedAt,
      coverImage {
        asset-> {
          _id,
          url,
          metadata {
            dimensions {
              width,
              height
            }
          }
        },
        hotspot,
        crop,
        alt
      },
      coverMobileImage {
        asset-> {
          _id,
          url,
          metadata {
            dimensions {
              width,
              height
            }
          }
        },
        hotspot,
        crop,
        alt
      },
      categories[]-> {
        _id,
        name,
        slug {
          current
        },
        color,
        icon {
          asset-> {
            _id,
            url,
            metadata {
              dimensions {
                width,
                height
              }
            }
          },
          hotspot,
          crop,
          alt
        },
        mainCategory-> {
          _id,
          name,
          slug {
            current
          },
          superCategory-> {
            _id,
            name,
            slug {
              current
            }
          }
        }
      }
    }`
  },

  // Zapytania dla kategorii głównych
  MAIN_CATEGORY: {
    // Pobierz wszystkie kategorie główne
    ALL: `*[_type == "mainCategory" && isActive == true] | order(name asc) {
      _id,
      name,
      slug {
        current
      },
      color,
      description,
      icon {
        asset-> {
          _id,
          url,
          metadata {
            dimensions {
              width,
              height
            }
          }
        },
        hotspot,
        crop
      },
      invertOnDark,
      superCategory-> {
        _id,
        name,
        slug {
          current
        }
      }
    }`,

    // Pobierz kategorię główną po slug
    BY_SLUG: `*[_type == "mainCategory" && slug.current == $slug][0] {
      _id,
      name,
      slug {
        current
      },
      color,
      description,
      icon {
        asset-> {
          _id,
          url,
          metadata {
            dimensions {
              width,
              height
            }
          }
        },
        hotspot,
        crop
      },
      invertOnDark,
      superCategory-> {
        _id,
        name,
        slug {
          current
        }
      }
    }`,

    // Pobierz podkategorie dla kategorii głównej
    SUBCATEGORIES: `*[_type == "category" && mainCategory->slug.current == $mainCategorySlug && isActive == true] | order(name asc) {
      _id,
      name,
      slug {
        current
      },
      color,
      description,
      icon {
        asset-> {
          _id,
          url,
          metadata {
            dimensions {
              width,
              height
            }
          }
        },
        hotspot,
        crop,
        alt
      },
      mainCategory-> {
        _id,
        name,
        slug {
          current
        }
      }
    }`,

    // Pobierz posty z kategorii głównej (wszystkie podkategorie)
    POSTS: `*[_type == "post" && defined(publishedAt) && ($mainCategorySlug in mainCategories[]->slug.current || $mainCategorySlug in categories[]->mainCategory->slug.current)] | order(publishedAt desc, _createdAt desc) {
      _id,
      title,
      subtitle,
      description,
      slug,
      publishedAt,
      coverImage {
        asset-> {
          _id,
          url,
          metadata {
            dimensions {
              width,
              height
            }
          }
        },
        hotspot,
        crop,
        alt
      },
      coverMobileImage {
        asset-> {
          _id,
          url,
          metadata {
            dimensions {
              width,
              height
            }
          }
        },
        hotspot,
        crop,
        alt
      },
      categories[]-> {
        _id,
        name,
        slug {
          current
        },
        color,
        icon {
          asset-> {
            _id,
            url,
            metadata {
              dimensions {
                width,
                height
              }
            }
          },
          hotspot,
          crop,
          alt
        },
        mainCategory-> {
          _id,
          name,
          slug {
            current
          },
          superCategory-> {
            _id,
            name,
            slug {
              current
            }
          }
        }
      }
    }`
  },

  // Zapytania dla podkategorii
  CATEGORY: {
    // Pobierz wszystkie podkategorie
    ALL: `*[_type == "category" && isActive == true] | order(name asc) {
      _id,
      name,
      slug {
        current
      },
      color,
      description,
      icon {
        asset-> {
          _id,
          url,
          metadata {
            dimensions {
              width,
              height
            }
          }
        },
        hotspot,
        crop,
        alt
      },
      mainCategory-> {
        _id,
        name,
        slug {
          current
        },
        superCategory-> {
          _id,
          name,
          slug {
            current
          }
        }
      }
    }`,

    // Pobierz podkategorię po slug
    BY_SLUG: `*[_type == "category" && slug.current == $slug][0] {
      _id,
      name,
      slug {
        current
      },
      color,
      description,
      icon {
        asset-> {
          _id,
          url,
          metadata {
            dimensions {
              width,
              height
            }
          }
        },
        hotspot,
        crop,
        alt
      },
      mainCategory-> {
        _id,
        name,
        slug {
          current
        },
        superCategory-> {
          _id,
          name,
          slug {
            current
          }
        }
      }
    }`,

    // Pobierz posty z podkategorii (zoptymalizowane)
    POSTS: `*[_type == "post" && defined(publishedAt) && $slug in categories[]->slug.current] | order(publishedAt desc, _createdAt desc) {
      _id,
      title,
      subtitle,
      description,
      slug,
      publishedAt,
      coverImage {
        asset-> {
          _id,
          url,
          metadata {
            dimensions {
              width,
              height
            }
          }
        },
        hotspot,
        crop,
        alt
      },
      coverMobileImage {
        asset-> {
          _id,
          url,
          metadata {
            dimensions {
              width,
              height
            }
          }
        },
        hotspot,
        crop,
        alt
      },
      categories[]-> {
        _id,
        name,
        slug {
          current
        },
        color,
        icon {
          asset-> {
            _id,
            url,
            metadata {
              dimensions {
                width,
                height
              }
            }
          },
          hotspot,
          crop,
          alt
        },
        mainCategory-> {
          _id,
          name,
          slug {
            current
          },
          superCategory-> {
            _id,
            name,
            slug {
              current
            }
          }
        }
      }
    }`
  },

  // Zapytania dla strony głównej
  HOME: {
    // Pobierz kategorie nadrzędne dla strony głównej
    SUPER_CATEGORIES: `*[_type == "superCategory" && isActive == true] | order(name asc) {
      _id,
      name,
      slug {
        current
      },
      color,
      description,
      icon {
        asset-> {
          _id,
          url,
          metadata {
            dimensions {
              width,
              height
            }
          }
        },
        hotspot,
        crop
      },
      invertOnDark
    }`,
    // Pobierz kategorie główne dla strony głównej
    MAIN_CATEGORIES: `*[_type == "mainCategory" && isActive == true] | order(name asc) {
      _id,
      name,
      slug {
        current
      },
      color,
      description,
      icon {
        asset-> {
          _id,
          url,
          metadata {
            dimensions {
              width,
              height
            }
          }
        },
        hotspot,
        crop
      },
      invertOnDark
    }`,
    // Pobierz wszystkie komponenty strony głównej (z limitem dla wydajności)
    COMPONENTS: `*[_type in ["heroBanner", "backgroundHeroBanner", "textContent", "imageCollage", "articles", "embedYoutube", "instagramSection", "newsletter", "youtubeChannel"]] | order(_createdAt asc) [0...50] {
      _type,
      _key,
      ...,
      container {
        ...,
        "contentTitle": @.contentTitle
      },
      content[] {
        ...,
        children[] {
          ...,
          marks[],
          markDefs[] {
            ...,
            _type == "link" => {
              ...,
              "href": @.href,
              "blank": @.blank
            },
            _type == "customStyle" => {
              ...,
              "style": @.style
            }
          }
        }
      },
      image {
        asset-> {
          _id,
          url,
          metadata {
            dimensions {
              width,
              height
            }
          }
        },
        hotspot,
        crop
      },
      images[] {
        asset-> {
          _id,
          url,
          metadata {
            dimensions {
              width,
              height
            }
          }
        },
        hotspot,
        crop,
        alt
      },
      buttons[] {
        ...,
        _type == "button" => {
          ...,
          "label": @.label,
          "href": @.href,
          "variant": @.variant,
          "external": @.external
        }
      },
      // Specjalne pola dla backgroundHeroBanner
      mobileContent[] {
        ...,
        children[] {
          ...,
          marks[],
          markDefs[] {
            ...,
            _type == "link" => {
              ...,
              "href": @.href,
              "blank": @.blank
            },
            _type == "customStyle" => {
              ...,
              "style": @.style
            }
          }
        },
        // Specjalne pola dla youtubeChannel
        title,
        channelName,
        channelDescription,
        channelHref,
        buttonText,
        buttonVariant,
        channelImage {
          asset-> {
            _id,
            url,
            metadata {
              dimensions {
                width,
                height
              }
            }
          },
          hotspot,
          crop,
          alt
        }
      }
    }`,

    // Pobierz dane strony głównej z Sanity
    HOMEPAGE_DATA: `*[_type == "homepage"][0] {
      _id,
      seo {
        seoTitle,
        seoDescription,
        seoKeywords,
        canonicalUrl,
        noIndex,
        noFollow,
        ogTitle,
        ogDescription,
        ogImage {
          asset-> {
            _id,
            url,
            metadata {
              dimensions {
                width,
                height
              }
            }
          },
          hotspot,
          crop
        }
      },
      heroComponents[] {
        _type,
        _key,
        ...,
        container {
          ...,
          "contentTitle": @.contentTitle
        },
        content[] {
          ...,
          children[] {
            ...,
            marks[],
            markDefs[] {
              ...,
              _type == "link" => {
                ...,
                "href": @.href,
                "blank": @.blank
              },
              _type == "customStyle" => {
                ...,
                "style": @.style
              }
            }
          }
        },
        image {
          asset-> {
            _id,
            url,
            metadata {
              dimensions {
                width,
                height
              }
            }
          },
          hotspot,
          crop
        },
        mobileImage {
          asset-> {
            _id,
            url,
            metadata {
              dimensions {
                width,
                height
              }
            }
          },
          hotspot,
          crop
        },
        images[] {
          asset-> {
            _id,
            url,
            metadata {
              dimensions {
                width,
                height
              }
            }
          },
          hotspot,
          crop,
          alt
        },
        buttons[] {
          ...,
          _type == "button" => {
            ...,
            "label": @.label,
            "href": @.href,
            "variant": @.variant,
            "external": @.external
          }
        },
        // Specjalne pola dla backgroundHeroBanner
        mobileContent[] {
          ...,
          children[] {
            ...,
            marks[],
            markDefs[] {
              ...,
              _type == "link" => {
                ...,
                "href": @.href,
                "blank": @.blank
              },
              _type == "customStyle" => {
                ...,
                "style": @.style
              }
            }
          }
        }
      },
      mainComponents[] {
        _type,
        _key,
        ...,
        container {
          ...,
          "contentTitle": @.contentTitle
        },
        content[] {
          ...,
          children[] {
            ...,
            marks[],
            markDefs[] {
              ...,
              _type == "link" => {
                ...,
                "href": @.href,
                "blank": @.blank
              },
              _type == "customStyle" => {
                ...,
                "style": @.style
              }
            }
          }
        },
        image {
          asset-> {
            _id,
            url,
            metadata {
              dimensions {
                width,
                height
              }
            }
          },
          hotspot,
          crop
        },
        mobileImage {
          asset-> {
            _id,
            url,
            metadata {
              dimensions {
                width,
                height
              }
            }
          },
          hotspot,
          crop
        },
        images[] {
          asset-> {
            _id,
            url,
            metadata {
              dimensions {
                width,
                height
              }
            }
          },
          hotspot,
          crop,
          alt
        },
        buttons[] {
          ...,
          _type == "button" => {
            ...,
            "label": @.label,
            "href": @.href,
            "variant": @.variant,
            "external": @.external
          }
        },
        // Specjalne pola dla backgroundHeroBanner
        mobileContent[] {
          ...,
          children[] {
            ...,
            marks[],
            markDefs[] {
              ...,
              _type == "link" => {
                ...,
                "href": @.href,
                "blank": @.blank
              },
              _type == "customStyle" => {
                ...,
                "style": @.style
              }
            }
          }
        },
        // Specjalne pola dla nowych komponentów
        title,
        subtitle,
        description,
        channelName,
        channelDescription,
        channelHref,
        buttonText,
        buttonVariant,
        contactHref,
        contactText,
        imageAlt,
        channelImage {
          asset-> {
            _id,
            url,
            metadata {
              dimensions {
                width,
                height
              }
            }
          },
          hotspot,
          crop,
          alt
        },
        instagramHandle,
        instagramUrl,
        placeholder,
        successMessage,
        errorMessage,
        privacyText,
        showBackground,
        thankYouMessage,
        supportOptions[] {
          id,
          name,
          href,
          icon {
            asset-> {
              _id,
              url
            }
          },
          iconSvg,
          variant,
          invertOnDark
        },
        categories[] {
          id,
          name,
          description,
          href,
          icon {
            asset-> {
              _id,
              url
            }
          },
          articleCount
        },
        posts[] {
          id,
          imageUrl {
            asset-> {
              _id,
              url,
              metadata {
                dimensions {
                  width,
                  height
                }
              }
            },
            hotspot,
            crop
          },
          caption,
          likes
        }
      },
      asideComponents[] {
        _type,
        _key,
        ...,
        container {
          ...,
          "contentTitle": @.contentTitle
        },
        title,
        subtitle,
        description,
        channelName,
        channelDescription,
        channelHref,
        buttonText,
        buttonVariant,
        contactHref,
        contactText,
        channelImage {
          asset-> {
            _id,
            url,
            metadata {
              dimensions {
                width,
                height
              }
            }
          },
          hotspot,
          crop,
          alt
        },
        image {
          asset-> {
            _id,
            url,
            metadata {
              dimensions {
                width,
                height
              }
            }
          },
          hotspot,
          crop
        },
        mobileImage {
          asset-> {
            _id,
            url,
            metadata {
              dimensions {
                width,
                height
              }
            }
          },
          hotspot,
          crop
        },
        imageAlt,
        thankYouMessage,
        supportOptions[] {
          id,
          name,
          href,
          icon {
            asset-> {
              _id,
              url
            }
          },
          iconSvg,
          variant
        }
      },
      additionalComponents[] {
        _type,
        _key,
        ...,
        container {
          ...,
          "contentTitle": @.contentTitle
        },
        content[] {
          ...,
          children[] {
            ...,
            marks[],
            markDefs[] {
              ...,
              _type == "link" => {
                ...,
                "href": @.href,
                "blank": @.blank
              },
              _type == "customStyle" => {
                ...,
                "style": @.style
              }
            }
          }
        },
        // Specjalne pola dla youtubeChannel
        title,
        channelName,
        channelDescription,
        channelHref,
        buttonText,
        buttonVariant,
        channelImage {
          asset-> {
            _id,
            url,
            metadata {
              dimensions {
                width,
                height
              }
            }
          },
          hotspot,
          crop,
          alt
        },
        image {
          asset-> {
            _id,
            url,
            metadata {
              dimensions {
                width,
                height
              }
            }
          },
          hotspot,
          crop
        },
        mobileImage {
          asset-> {
            _id,
            url,
            metadata {
              dimensions {
                width,
                height
              }
            }
          },
          hotspot,
          crop
        },
        images[] {
          asset-> {
            _id,
            url,
            metadata {
              dimensions {
                width,
                height
              }
            }
          },
          hotspot,
          crop,
          alt
        },
        buttons[] {
          ...,
          _type == "button" => {
            ...,
            "label": @.label,
            "href": @.href,
            "variant": @.variant,
            "external": @.external
          }
        },
        // Specjalne pola dla backgroundHeroBanner
        mobileContent[] {
          ...,
          children[] {
            ...,
            marks[],
            markDefs[] {
              ...,
              _type == "link" => {
                ...,
                "href": @.href,
                "blank": @.blank
              },
              _type == "customStyle" => {
                ...,
                "style": @.style
              }
            }
          }
        }
      },
      pageSettings {
        showBreadcrumbs,
        showLastUpdated,
        enableComments,
        showSocialShare
      }
    }`
  }
} as const;
