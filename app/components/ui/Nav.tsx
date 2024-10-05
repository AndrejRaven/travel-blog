import { CustomLink } from "./Link";

const Nav = () => {
  return (
    <nav className="flex justify-center my-4">
      <ul className="flex items-center justify-between gap-4">
        <li>
          <CustomLink href="/nasze-podroze">Nasze podróże</CustomLink>
        </li>
        <li>
          <CustomLink href="/o-nas">O nas</CustomLink>
        </li>
        <li>
          <CustomLink href="/kontakt">Kontakt</CustomLink>
        </li>
      </ul>
    </nav>
  );
};

export { Nav };
