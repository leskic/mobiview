# encoding: UTF-8

require "fileutils"

module MobiViewExporter

  module MvprojWriter

    extend self

    def export(model, pieces)

      folder = UI.select_directory(
        title: "Escolha a pasta do Projeto MobiView"
      )

      return unless folder

      project_name = safe_name(model.title)

      output_folder = File.join(folder, project_name)

      FileUtils.mkdir_p(output_folder)

      ########################################################
      # WRITERS
      ########################################################

      ManifestWriter.write(
        model,
        output_folder
      )

      ProjectWriter.write(
        model,
        pieces,
        output_folder
      )

      PiecesWriter.write(
        pieces,
        output_folder
      )

      ModulesWriter.write(
        pieces,
        output_folder
      )

      MaterialsWriter.write(
        pieces,
        output_folder
      )

      SceneWriter.write(
        pieces,
        output_folder
      )

      ########################################################

      UI.messagebox(

        "Projeto exportado com sucesso!\n\n" \
        "Projeto: #{model.title}\n" \
        "Peças: #{pieces.size}\n\n" \
        "Arquivos gerados:\n" \
        "- manifest.json\n" \
        "- project.json\n" \
        "- pieces.json\n" \
        "- modules.json\n" \
        "- materials.json\n" \
        "- scene.json"

      )

      output_folder

    end

    ########################################################

    def safe_name(name)

      return "Projeto" if name.nil?

      text = name.strip

      return "Projeto" if text.empty?

      text.gsub(/[\\\/:*?"<>|]/, "_")

    end

  end

end