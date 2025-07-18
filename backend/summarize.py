import openai
import os

openai.api_key = os.getenv("OPENAI_API_KEY")  # Set this securely in your environment

def generate_summary(params):
    try:
        prompt = (
            "You are a Mössbauer spectroscopy expert. Based on the following parameters "
            "from a 57Fe spectrum fit, provide a brief interpretation of the iron sites. "
            f"Here are the parameters:\n{params}\n\n"
            "Explain what each site could represent in terms of oxidation state and spin state. "
            "Write your answer as if for a research paper or thesis."
        )

        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a Mössbauer spectroscopy assistant."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.4,
            max_tokens=300
        )

        return response.choices[0].message['content']

    except Exception as e:
        return f"AI summary generation failed: {e}"
