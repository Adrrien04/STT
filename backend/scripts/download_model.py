from requests import get
from scripts.utils.parsers import TableParser, ModelSearcher
from simple_term_menu import TerminalMenu
from os import path, makedirs, listdir
from shutil import rmtree, move
from zipfile import ZipFile
from io import BytesIO


content = get("https://alphacephei.com/vosk/models")
parser = TableParser(content.text)
searcher = ModelSearcher(parser)
languages = sorted(searcher.get_languages())
terminal_menu = TerminalMenu(languages)
menu_entry_index = terminal_menu.show()
selected_language = languages[menu_entry_index]
print(f"Selected language: {selected_language}")

models = searcher.get_models_by_language(selected_language)


models_names = list(models.keys())
terminal_menu = TerminalMenu(models_names)
menu_entry_index = terminal_menu.show()
selected_model = models[models_names[menu_entry_index]]
print(f"Selected model: {selected_model['name']}")

if not path.exists("model"):
    makedirs("model")

name_file_path = path.join("model", "name.txt")

if path.exists(name_file_path):
    with open(name_file_path, "r") as f:
        model_name = f.read().strip()
        print(f"{model_name} is already downloaded, are sure to replace it? (y/n)")
        choice = input().lower()
        if choice != "y":
            print("Exiting without downloading.")
            exit(0)


rmtree("model")
makedirs("model")
print("Downloading model...")
response = get(selected_model["url"], stream=True)
total_size = int(response.headers.get("content-length", 0))
downloaded_size = 0

zip_content = BytesIO()
for chunk in response.iter_content(chunk_size=8192):
    if chunk:
        zip_content.write(chunk)
        downloaded_size += len(chunk)
        progress = (downloaded_size / total_size) * 100
        print(f"\rProgress: {progress:.2f}%", end="")

print("\nExtracting model...")
with ZipFile(zip_content) as zip_ref:
    temp_extract = "model/tmp"
    makedirs(temp_extract, exist_ok=True)
    zip_ref.extractall(temp_extract)
    model_content = path.join(temp_extract, listdir(temp_extract)[0])
    for item in listdir(model_content):
        move(path.join(model_content, item), path.join("model", item))

    rmtree(temp_extract)

with open(name_file_path, "w") as f:
    f.write(selected_model["name"])

print("Model downloaded and extracted successfully!")
