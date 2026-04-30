# Importando este projeto para o GitHub

Siga estes passos no PowerShell (Windows) para criar um repositório remoto e enviar (push) o código.

1) Abra PowerShell e navegue até a pasta do projeto:

```powershell
cd 'c:\Users\HP\Documents\Apps\titanet\nextjs_space'
```

2) Inicialize git (se ainda não existir):

```powershell
git init
git add .
git commit -m "Initial commit - import project"
```

3) (Opcional) Usando GitHub CLI para criar o repositório remoto rapidamente (recomendado):

```powershell
# Faça login com: gh auth login
gh repo create your-username/your-repo-name --public --source=. --remote=origin --push
```

Substitua your-username/your-repo-name pelo nome do seu usuário e repositório.

4) Se não usar gh, crie um repositório no GitHub via site e adicione o remote manualmente:

```powershell
git remote add origin https://github.com/your-username/your-repo-name.git
git branch -M main
git push -u origin main
```

5) Após o push, abra o repositório no GitHub e verifique Actions → CI para ver o workflow rodando.

Pronto — o projeto estará disponível no GitHub e pronto para ser continuado com o Copilot.
