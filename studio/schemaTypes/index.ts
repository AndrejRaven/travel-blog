import post from "../schemas/strony/post"
import homepage from "../schemas/strony/homepage"
import category from "../schemas/strony/category"
import header from "../schemas/header/header"
import button from "../schemas/elementy/button"
import comment from "../schemas/comentaries/comentaries"
import { schemaTypesComponents } from "./schemaTypesComponents"

export const schemaTypes = [
  post, 
  homepage,
  category,
  header, 
  button,
  comment,
  ...schemaTypesComponents
]
