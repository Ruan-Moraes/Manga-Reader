"""Regressão de inicialização sem artefatos internos no repositório Maven local.

Execute: python3 api/scripts/tests/test_reactor_run.py
Reutiliza o cache de dependências externas; não requer Docker nem inicia serviços.
"""

import os
from pathlib import Path
import subprocess
import tempfile
import unittest
import xml.etree.ElementTree as ET


API = Path(__file__).resolve().parents[2]
CONFIGURATIONS = (
    "API Core",
    "Job Rating Aggregator",
    "Job Orphan Cleaner",
    "Job Trending Aggregator",
    "Translation Gateway",
)


class ReactorRunTest(unittest.TestCase):
    def test_run_from_clean_build_without_installed_internal_artifacts(self):
        with tempfile.TemporaryDirectory(prefix="toonlira-reactor-") as directory:
            workspace = Path(directory)
            repository = workspace / "repository"
            repository.mkdir()
            cache = Path(os.environ.get("MAVEN_TEST_CACHE", Path.home() / ".m2/repository"))
            # Isolar com/toonlira sem baixar novamente todas as dependências externas.
            for entry in cache.iterdir():
                if entry.name == "com":
                    (repository / "com").mkdir()
                    for group in entry.iterdir():
                        if group.name != "toonlira":
                            (repository / "com" / group.name).symlink_to(group, target_is_directory=True)
                else:
                    (repository / entry.name).symlink_to(entry, target_is_directory=entry.is_dir())

            source = workspace / "ReactorRunProbe.java"
            source.write_text('''public class ReactorRunProbe {
    public static void main(String[] args) {
        if (Runtime.version().feature() != 25) {
            throw new IllegalStateException("O backend exige Java 25");
        }
        System.out.println("TOONLIRA_REACTOR_RUN_OK");
    }
}
''')
            java_home = os.environ.get("JAVA_HOME")
            javac = str(Path(java_home) / "bin/javac") if java_home else "javac"
            subprocess.run([javac, "-d", str(workspace), str(source)], check=True)
            baseline = subprocess.run(
                [str(API / "mvnw"), "-B", "-o", f"-Dmaven.repo.local={repository}",
                 "-pl", "apps/core", "spring-boot:run"],
                cwd=API, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                timeout=60,
            )
            self.assertNotEqual(baseline.returncode, 0, baseline.stdout)
            self.assertIn("com.toonlira:testing-support:jar", baseline.stdout)
            self.assertIn("Could not resolve dependencies", baseline.stdout)
            for name in CONFIGURATIONS:
                configuration = ET.parse(API.parent / ".run" / f"{name}.run.xml")
                goals = [option.attrib["value"] for option in configuration.findall(
                    ".//MavenRunnerParameters/option[@name='goals']/list/option")]
                goals.insert(0, "clean")
                with self.subTest(configuration=name):
                    result = subprocess.run(
                        [str(API / "mvnw"), "-B", "-o", f"-Dmaven.repo.local={repository}",
                         *goals,
                         "-Dspring-boot.run.main-class=ReactorRunProbe",
                         f"-Dspring-boot.run.additional-classpath-elements={workspace}"],
                        cwd=API, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                        timeout=300,
                    )
                    self.assertEqual(result.returncode, 0, result.stdout)
                    self.assertEqual(result.stdout.count("TOONLIRA_REACTOR_RUN_OK"), 1, result.stdout)
                    self.assertFalse((repository / "com/toonlira").exists())


if __name__ == "__main__":
    unittest.main()
