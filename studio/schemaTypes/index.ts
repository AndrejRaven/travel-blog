import post from "../schemas/strony/post"
import homepage from "../schemas/strony/homepage"
import category from "../schemas/strony/category"
import mainCategory from "../schemas/strony/mainCategory"
import superCategory from "../schemas/strony/superCategory"
import header from "../schemas/header/header"
import button from "../schemas/elementy/button"
import comment from "../schemas/comentaries/comentaries"
import siteConfig from "../schemas/shared/siteConfig"
import author from "../schemas/shared/author"
import { schemaTypesComponents } from "./schemaTypesComponents"

export const schemaTypes = [
  post, 
  homepage,
  category,
  mainCategory,
  superCategory,
  header, 
  button,
  comment,
  siteConfig,
  author,
  ...schemaTypesComponents
]
