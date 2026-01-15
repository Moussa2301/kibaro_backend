// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔁 Nettoyage des données existantes...");
  await prisma.answer.deleteMany();
  await prisma.question.deleteMany();
  await prisma.chapter.deleteMany();
  await prisma.badge.deleteMany();

  console.log("🌱 Création des chapitres + questions...");

  const chapters = [
    {
      title: "L'indépendance de la Guinée",
      period: "1958",
      order: 1,
      content:
        "Le 2 octobre 1958, la Guinée devient le premier pays africain à dire « NON » au référendum proposé par le général de Gaulle. Ce choix ouvre la voie à son indépendance totale. Ahmed Sékou Touré devient le premier président du pays.",
      questions: [
        {
          text: "En quelle année la Guinée a-t-elle obtenu son indépendance ?",
          answers: [
            { text: "1958", isCorrect: true },
            { text: "1960", isCorrect: false },
            { text: "1965", isCorrect: false },
            { text: "1956", isCorrect: false },
          ],
        },
        {
          text: "Quel leader est devenu le premier président après l’indépendance ?",
          answers: [
            { text: "Ahmed Sékou Touré", isCorrect: true },
            { text: "Lansana Conté", isCorrect: false },
            { text: "Alpha Condé", isCorrect: false },
            { text: "Sidya Touré", isCorrect: false },
          ],
        },
        {
          text: "Quel pays fut le premier à dire NON au référendum de 1958 ?",
          answers: [
            { text: "La Guinée", isCorrect: true },
            { text: "Le Mali", isCorrect: false },
            { text: "La Côte d'Ivoire", isCorrect: false },
            { text: "Le Sénégal", isCorrect: false },
          ],
        },
        {
          text: "Quelle date marque l’indépendance officielle de la Guinée ?",
          answers: [
            { text: "2 octobre 1958", isCorrect: true },
            { text: "1er janvier 1959", isCorrect: false },
            { text: "25 septembre 1958", isCorrect: false },
            { text: "15 août 1958", isCorrect: false },
          ],
        },
      ],
    },
    {
      title: "Samory Touré et la résistance",
      period: "1882–1898",
      order: 2,
      content:
        "Samory Touré a été l’un des plus grands résistants ouest-africains face à la colonisation française. Chef du Wassoulou, il a mené une résistance héroïque pendant plus de 16 ans.",
      questions: [
        {
          text: "Qui était Samory Touré ?",
          answers: [
            { text: "Un résistant anticolonial", isCorrect: true },
            { text: "Un musicien", isCorrect: false },
            { text: "Un commerçant", isCorrect: false },
            { text: "Un roi européen", isCorrect: false },
          ],
        },
        {
          text: "Quel empire Samory Touré a-t-il fondé ?",
          answers: [
            { text: "L’Empire du Wassoulou", isCorrect: true },
            { text: "L’Empire du Mali", isCorrect: false },
            { text: "L’Empire Songhai", isCorrect: false },
            { text: "L’Empire Ghana", isCorrect: false },
          ],
        },
        {
          text: "Quel pays a combattu Samory Touré ?",
          answers: [
            { text: "La France", isCorrect: true },
            { text: "Le Portugal", isCorrect: false },
            { text: "L’Allemagne", isCorrect: false },
            { text: "L’Espagne", isCorrect: false },
          ],
        },
        {
          text: "Que se passe-t-il en 1898 pour Samory Touré ?",
          answers: [
            { text: "Sa capture par les troupes françaises", isCorrect: true },
            { text: "Il devient président", isCorrect: false },
            { text: "Il fonde Conakry", isCorrect: false },
            { text: "Il signe un traité de paix définitif", isCorrect: false },
          ],
        },
      ],
    },
    {
      title: "Le Royaume du Fouta-Djalon",
      period: "1725–1896",
      order: 3,
      content:
        "Le Fouta-Djalon fut un État théocratique dirigé par des Almamy. C’est l’un des royaumes les plus influents d’Afrique de l’Ouest avec un système politique bien organisé et des savants religieux prestigieux.",
      questions: [
        {
          text: "Quel type de gouvernement caractérise le Fouta-Djalon ?",
          answers: [
            { text: "Une théocratie", isCorrect: true },
            { text: "Une monarchie", isCorrect: false },
            { text: "Une république", isCorrect: false },
            { text: "Un empire", isCorrect: false },
          ],
        },
        {
          text: "Comment s'appelait le chef suprême du Fouta ?",
          answers: [
            { text: "L’Almamy", isCorrect: true },
            { text: "Le Roi", isCorrect: false },
            { text: "Le Sultan", isCorrect: false },
            { text: "Le Gouverneur", isCorrect: false },
          ],
        },
        {
          text: "Quelle ville est un centre historique important du Fouta ?",
          answers: [
            { text: "Labé", isCorrect: true },
            { text: "Faranah", isCorrect: false },
            { text: "Forécariah", isCorrect: false },
            { text: "Boké", isCorrect: false },
          ],
        },
        {
          text: "Le Fouta-Djalon est surtout connu pour :",
          answers: [
            {
              text: "Sa résistance et sa culture islamique",
              isCorrect: true,
            },
            { text: "Son industrie minière", isCorrect: false },
            { text: "Ses ports maritimes", isCorrect: false },
            { text: "Son désert", isCorrect: false },
          ],
        },
      ],
    },
    {
      title: "L’Empire du Mali",
      period: "XIIIe–XVIe siècle",
      order: 4,
      content:
        "L’Empire du Mali, fondé par Soundiata Keïta, est l'un des plus grands empires d’Afrique de l’Histoire. Mansa Musa, l’un de ses empereurs, reste célèbre comme l’un des hommes les plus riches de tous les temps.",
      questions: [
        {
          text: "Qui est le fondateur de l’Empire du Mali ?",
          answers: [
            { text: "Soundiata Keïta", isCorrect: true },
            { text: "Samory Touré", isCorrect: false },
            { text: "Mansa Musa", isCorrect: false },
            { text: "Askia Mohamed", isCorrect: false },
          ],
        },
        {
          text: "Pourquoi Mansa Musa est-il célèbre ?",
          answers: [
            {
              text: "Pour sa richesse exceptionnelle et son pèlerinage à La Mecque",
              isCorrect: true,
            },
            { text: "Pour avoir découvert l’Amérique", isCorrect: false },
            { text: "Pour avoir inventé l’écriture", isCorrect: false },
            { text: "Pour avoir colonisé l’Europe", isCorrect: false },
          ],
        },
        {
          text: "Quelle bataille est associée à la fondation de l’Empire du Mali ?",
          answers: [
            { text: "La bataille de Kirina", isCorrect: true },
            { text: "La bataille de Kankan", isCorrect: false },
            { text: "La bataille de Conakry", isCorrect: false },
            { text: "La bataille de Gabu", isCorrect: false },
          ],
        },
        {
          text: "Quels pays actuels faisaient partie de l’Empire du Mali ?",
          answers: [
            { text: "La Guinée", isCorrect: true },
            { text: "Le Portugal", isCorrect: false },
            { text: "L’Allemagne", isCorrect: false },
            { text: "Le Brésil", isCorrect: false },
          ],
        },
      ],
    },
    {
      title: "La Seconde République – Lansana Conté",
      period: "1984–2008",
      order: 5,
      content:
        "Après le décès de Sékou Touré, un groupe militaire prend le pouvoir en 1984 dirigé par le colonel Lansana Conté. Il dirige la Guinée pendant plus de deux décennies, jusqu’à sa mort en 2008.",
      questions: [
        {
          text: "En quelle année Lansana Conté arrive-t-il au pouvoir ?",
          answers: [
            { text: "1984", isCorrect: true },
            { text: "1974", isCorrect: false },
            { text: "1990", isCorrect: false },
            { text: "2000", isCorrect: false },
          ],
        },
        {
          text: "Comment Lansana Conté arrive-t-il au pouvoir ?",
          answers: [
            { text: "Par un coup d’État militaire", isCorrect: true },
            { text: "Par élection démocratique", isCorrect: false },
            { text: "Par référendum", isCorrect: false },
            { text: "Par héritage familial", isCorrect: false },
          ],
        },
        {
          text: "Combien de temps environ Lansana Conté a-t-il dirigé la Guinée ?",
          answers: [
            { text: "Environ 24 ans", isCorrect: true },
            { text: "5 ans", isCorrect: false },
            { text: "10 ans", isCorrect: false },
            { text: "2 ans", isCorrect: false },
          ],
        },
        {
          text: "Qui prend le pouvoir après la mort de Lansana Conté en 2008 ?",
          answers: [
            { text: "Moussa Dadis Camara", isCorrect: true },
            { text: "Alpha Condé", isCorrect: false },
            { text: "Cellou Dalein Diallo", isCorrect: false },
            { text: "Sékou Touré", isCorrect: false },
          ],
        },
      ],
    },
  ];

  for (const ch of chapters) {
    await prisma.chapter.create({
      data: {
        title: ch.title,
        period: ch.period,
        order: ch.order,
        content: ch.content,
        questions: {
          create: ch.questions.map((q) => ({
            text: q.text,
            answers: {
              create: q.answers.map((a) => ({
                text: a.text,
                isCorrect: a.isCorrect,
              })),
            },
          })),
        },
      },
    });
  }

  console.log("🏅 Création de quelques badges par défaut...");

  await prisma.badge.createMany({
    data: [
      {
        title: "Premier pas",
        description: "Tu as complété ton premier quiz sur Kibaro History.",
        icon: "🎉",
        condition: "Premier quiz complété",
      },
      {
        title: "500 points",
        description: "Tu as atteint un total de 500 points.",
        icon: "🏅",
        condition: "Atteindre 500 points",
      },
      {
        title: "Historien en herbe",
        description: "Tu as joué à plusieurs quiz sur l'histoire de la Guinée.",
        icon: "📚",
        condition: "Plusieurs quiz complétés",
      },
    ],
  });

  console.log("✅ Seed terminé avec succès !");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
