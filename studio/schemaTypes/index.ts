import post from "../schemas/strony/post"
import category from "../schemas/strony/category"
import header from "../schemas/header/header"
import button from "../schemas/elementy/button"
import { schemaTypesComponents } from "./schemaTypesComponents"

export const schemaTypes = [
  post, 
  category,
  header, 
  button, 
  ...schemaTypesComponents
]
