# Règles Unreal Engine 5 (C++)

- Respecte les conventions UE5: U pour UObject, A pour Actor, F pour struct, E pour enum
- Utilise les smart pointers UE (TSharedPtr, TWeakPtr) plutôt que les raw pointers
- Marque les propriétés avec UPROPERTY() pour l'exposition Blueprint/Editor
- Marque les fonctions avec UFUNCTION() pour l'exposition Blueprint
- Utilise BlueprintCallable, BlueprintPure selon le cas
- Gère le Garbage Collector avec AddToRoot/RemoveFromRoot si nécessaire
- Documente avec les commentaires /// pour la génération de documentation
- Privilégie les delegates et events pour la communication entre composants
- Utilise les macros UE appropriées (GENERATED_BODY, etc.)
