from bs4 import BeautifulSoup


class TableParser:
    def __init__(self, html):
        self.soup = BeautifulSoup(html, "html.parser")
        self.table = self.soup.find("table", class_="table table-bordered")
        self.tbody = self.table.find("tbody")

    def get_rows(self):
        return self.tbody.find_all("tr")


class ModelSearcher:
    def __init__(self, parser):
        self.parser = parser

    def get_languages(self):
        languages = set()
        rows = self.parser.get_rows()
        for i in rows:
            strong = i.find("strong")
            if strong:
                languages.add(strong.text)
        return list(languages)

    def get_models_by_language(self, language):
        models = {}
        rows = self.parser.get_rows()
        for i in rows:
            strong = i.find("strong")
            if strong and strong.text == language:
                model_rows = self._next_until_strong(i.find_next_sibling("tr"))
                for row in model_rows:
                    cols = row.find_all("td")
                    name = cols[0].text.strip()
                    models[name] = {
                        "name": cols[0].text.strip(),
                        "size": cols[1].text.strip(),
                        "url": cols[0].find("a")["href"],
                    }

        return models

    def _next_until_strong(self, start_row, rows=[]):
        if not start_row or start_row.find("strong"):
            return rows

        next_row = start_row.find_next_sibling("tr")
        rows.append(start_row)
        return self._next_until_strong(next_row, rows)
